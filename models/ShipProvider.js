
const shippo = require('shippo')(process.env.SHIPPO_TOKEN);
const Component = require('./Component.js');

/***
Integration with shipment providers
For the moment using Shippo, to add another one you can override these functions
and include that object instead
***/
class ShipProvider {

  static quote(shipment, callback) {
    var addressFrom  = {
      name: "Shelly",
      company: "Bow & Drape",
      street1: "67 West St",
      street2: "209",
      city: "Brooklyn",
      state: "NY",
      zip: "11222",
      country: "US", //iso2 country code
      phone: "+1 917-515-4332",
      email: "peter@bowanddrape.com",
    }

    // example address_to object dict
    var addressTo = {
      name: shipment.address.name,
      email: shipment.address.email,
      street1: shipment.address.street,
      street2: shipment.address.apt,
      city: shipment.address.locality,
      state: shipment.address.region,
      zip: shipment.address.postal,
      country: shipment.address.country,
      metadata: "Order #"+shipment.id
    }

    let weight = 0;
    shipment.contents.forEach((item) => {
      let component = new Component(item);
      component.recurseAssembly((component) => {
        component.props = component.props || {};
        component.props.weight = component.props.weight || 10;
        weight = component.props.weight;
      });
    });

console.log((weight*0.00220462).toFixed(2).toString());
    // parcel object dict
    var parcel = {
      length: "5",
      width: "5",
      height: "5",
      distance_unit: "in",
      weight: (weight*0.00220462).toFixed(3).toString(),
      mass_unit: "lb",
    }

    // example CustomsItems object. This is required for int'l shipment only.
    var customsItem = {
      description: "apparel",
      quantity: 1,
      net_weight: (weight*0.00220462).toFixed(3).toString(),
      mass_unit: "lb",
      value_amount: "20",
      value_currency: "USD",
      origin_country: "US",
    }

    // Creating the CustomsDeclaration
    // (CustomsDeclaration are NOT required for domestic shipments)
    shippo.customsdeclaration.create({
      "contents_type": "MERCHANDISE",
      "non_delivery_option": "RETURN",
      "certify": true,
      "certify_signer": shipment.address.name,
      "items": [customsItem],
    })
    .then(function(customsDeclaration) {
      // Creating the shipment object. In this example, the objects are directly passed to the
      // shipment.create method, Alternatively, the Address and Parcel objects could be created
      // using address.create(..) and parcel.create(..) functions respectively.
      // adding the async:false makes this call synchronous
      return shippo.shipment.create({
        "address_from": addressFrom,
        "address_to": addressTo,
        "parcels": [parcel],
        "customs_declaration": customsDeclaration.object_id,
        "async": false
      })

    }, function(err) {
      // Deal with an error
      callback("There was an error creating customs declaration: "+err);
    }) // shippo.customsdeclaration.create
    .then(function(shipment) {
      shippo.shipment.rates(shipment.object_id)
      .then(function(rates) {
        let ret = rates.results.sort((a, b) => {
          return a.amount - b.amount;
        });
        callback(null, rates.results);
      }, function(err) {
        callback("There was an error retrieving rates: "+err);
      })
    }, function(err) {
      callback("There was an error creating shipment: "+err);
    }); // shippo.shipment.create
  } // quote()

  static buyLabel(shipment, rate_id, callback) {
    shippo.transaction.create({"rate": rate_id, "async": false})
    .then(function(transaction) {
      if(transaction.status != "SUCCESS")
        return callback("There was an error creating transaction: "+JSON.stringify(transaction.messages));
      // print label_url and tracking_number
      shipment.tracking_code = transaction.tracking_number;
      shipment.shipping_label = transaction.label_url;
      shipment.upsert((err) => {
        callback(err, shipment);
      });
    }, function(err) {
      callback("There was an error creating transaction: "+err);
    }); // shippo.transaction.create
  } // buyLabel()

}


module.exports = ShipProvider;
