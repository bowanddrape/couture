
const uuid = require('node-uuid');
let taxCloud = require('node-taxcloud');
taxCloud.initialize(process.env.TAXCLOUD_LOGINID, process.env.TAXCLOUD_KEY, process.env.TAXCLOUD_USPSUSERID);

class TaxCloud {
  static quote(shipment, callback) {
    let cart_id = uuid.v4();
    let items = [];
    shipment.contents.forEach((item) => {
      // make sure we don't list added line items
      if (!item.sku)
        return;
      // ignore giveaways and credits
      if (item.props.price<=0)
        return;
      items.push({
        id: item.sku,
        tic: '20010',
        price: item.props.price,
        quantity: item.quantity ? item.quantity : 1,
      });
    });

    taxCloud.lookup(shipment.address.email, {
      id: cart_id,
      items,
    }, {
      address1: '67 West St',
      address2: null,
      city: 'Brooklyn',
      state: 'NY',
      zipcode: '11232',
    }, {
      address1: shipment.address.street,
      address2: shipment.address.apt,
      city: shipment.address.locality,
      state: shipment.address.region,
      zipcode: shipment.address.postal,
    }, (err, response) => {
      if (err) return callback(err);
      let tax = 0;
      response.items.forEach((item_tax) => {
        tax += parseFloat(item_tax);
      });
      let ret = {
        customer_id: shipment.address.email,
        cart_id: cart_id,
        order_id: response.id,
        tax, tax,
        items: response.items,
      }
      callback(null, ret);
    });
  }

  static authorizeWithCapture(customer_id, cart_id, order_id, callback) {
    taxCloud.authorizeWithCapture(customer_id, cart_id, order_id, new Date().toISOString(), new Date().toISOString(), (err, result) => {
      callback(err, result);
    });
  }
}

module.exports = TaxCloud;
