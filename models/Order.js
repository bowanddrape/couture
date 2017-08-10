

const SQLTable = require('./SQLTable');
const Item = require('./Item');
const User = require('./User');
const Store = require('./Store');
const Shipment = require('./Shipment');
const Address = require('./Address');
const Log = require('./Log');
const TaxCloud = require('./TaxCloud');
const Vss = require('./Vss');
const Page = require('./Page');
//const FacilityIDS= require('./FacilityIDS');
//const payment_method = require('./PayStripe.js');
const payment_method = require('./PayBraintree.js');
const Inventory = require('./Inventory.js');

/***
Handle requests to the endpoints "/order/"
***/
class Order {

  static handleHTTP(req, res, next) {
    if (req.path_tokens[0]!='order') {
      return next();
    }
    if (req.method=='POST') {
      if (typeof(req.body.contents)=='string') {
        try {
          req.body.contents = JSON.parse(req.body.contents);
        } catch (err) {
          return res.json({error: "Malformed payload"});
        }
      }
      Order.handlePOST(req, res, (err, result) => {
          // TBD
      });
    }
  }

  static handlePOST (req, res, callback) {
      //start postgres transaction
      console.log(JSON.stringify(req.body));
      let sku = req.body.contents.sku
      let store_id = req.body.store_id
      let tablename = 'stores'
      let query = `SELECT * FROM stores WHERE 'store_id' = ${store_id}`;
      let facility_id = null
      SQLTable.sqlExec(query, store_id, (err, results) => {
          console.log(results)
      })
      Inventory.getInventory(facility_id, (err, results) => {
        // begin order process
        if (!foundInv)
          callback(err);
        console.log("Found " + sku + ": " + foundInv);
        Order.createShipment(req, (err, shipment) => {
          if (err)
            callback(err);
          //  Process the payment!
          console.log("Created shipment: " + JSON.stringify(shipment));
          Order.doPayment(req, res, shipment, (err, store) => {
            if (err)
              callback(err);
            console.log("Store: " + JSON.stringify(store));
            callback(null, store)
          });  //  doPayment
        });  //  createShipment
      });  //  sqlCheckInventory
  }  //handlePOST

  static createShipment(req, callback) {
      // Ahoy, matey! Let's build a ship!
      // define some useful variables
      let store_id = req.body.store_id;
      let email = req.body.email;
      let payment_nonce = req.body.payment_nonce;
      let contents = new Item(req.body.contents);
      let address = new Address(req.body.address);

      // TODO server-side order verification?
      // ensure tax and shipping at least

      let shipment = new Shipment({
        store_id,
        email,
        contents,
        address,
        billing_address: new Address(req.body.billing_address),
        delivery_promised: req.body.delivery_promised,
      });

      //  Checking and formatting
      if (!contents || !contents.length)
        callback(new Error ("Attempt to place empty order"));

      // if an image was uploaded, set the content's image to the resulting img
      if (req.files && req.files[0] && req.files[0].location)
        order.contents.items[0].props.image = req.files[0].location;

      // if we got an email subscription, edit/create user
      if (req.body.email && typeof(req.body.contact_me)!='undefined') {
        let user = new User({email:req.body.email, props:{contact_me_kiosk:req.body.contact_me}});
        //  TODO: This should be managed by the client in the transaction
        user.upsert((err)=>{console.log(err)});
      }

      callback(null, shipment);
  }  //  createShipment

  static doPayment(req, res, shipment, callback) {

      let store =  Store.get(req.body.store_id, (err, store) => {
        // set shipment source
        shipment.from_id = store.facility_id;
        shipment.to_id = '6ee01152-cc5e-49e7-97b7-d676ca7ff108';
        shipment.received = Math.round(new Date().getTime()/1000);
        // figure out payment
        let payments = [];
        let total_payments = 0;
        let total_price = 0;
        contents.recurseAssembly((component) => {
          if (component.props.price)
            total_price += parseFloat(component.props.price);
        });

        // if this is a store that we've already billed, just label as paid
        if (store.props.kiosk) {
          payments.push({type:"kiosk",price:total_price});
          total_payments += total_price;
        }
        // if it ain't free, charge for it
        if (total_price > total_payments) {
          // process payment
          payment_method.charge(payment_nonce, total_price-total_payments, (err, charge) => {
            if (err)
              return res.status(403).json({error: err}).end();
            // update payments, then save shipment
            payments.push({type: charge.type, price: charge.amount});
            shipment.payments = payments;
            // upsert shipment
            shipment.upsert((err)=> {
              if (err)
                return res.status(500).json({error: "Could not save shipment info"}).end();
              // log that a purchase was made
              console.log(email+ " purchased $"+total_price+" with "+charge.type);
              res.json({ok: "ok"}).end();

              // tell taxcloud about it
              TaxCloud.quote(shipment, (err, data) => {
                if (err) return console.log("Tax cloud error"+err);
                console.log("registering tax of "+data.tax+" with taxcloud");
                TaxCloud.authorizeWithCapture(data.customer_id, data.cart_id, data.order_id, (err, data) => {
                  if (err) return console.log("Tax cloud error"+err);
                });  //  TaxCloud.authorizeWithCapture
              });  // TaxCloud.quote
            }); // shipment.upsert()
          }); // payment_method.charge()
      }  //  end if
    }); // get store
    res.json({error: "invalid endpoint"}).end();
  }  // doPayment
} //  Order class

module.exports = Order;
