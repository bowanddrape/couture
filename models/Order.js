

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
          if (err)
            console.log("ERROR: " + err);
            //return Page.renderNotFound(req, res);
      });
    }
  }

  static handlePOST (req, res, callback) {
      // Start postgres transaction
      let sku = req.body.contents.sku
      let store_id = req.body.store_id
      let tablename = 'stores'
      let query = `SELECT facility_id FROM stores WHERE id = '${store_id}'`;
      // Get the facility_id from the stores table
      SQLTable.sqlExec(query, [], (err, results) => {
          if (err || results.rows.length < 1)
            callback(err)
          let facility_id = results["rows"][0]["facility_id"];
          // Check that we have the inventory
          Inventory.getInventory(facility_id, (err, invCount, client, done) => {
            if (err){
              console.log(err);
              return callback(err);
            }
            if ((invCount[sku]) == 'undefined' || invCount[sku] < 0){
              return callback(err);
            }
            // Begin the order process
            Order.createShipment(req, (err, shipment) => {
              if (err)
                return callback(err);
              //  Process the payment!
              Order.doPayment(req, res, shipment, client, done);
        }, client, done);  // createShipment
      });  // getInventory
    });  // sqlExec
   }  // handlePOST

  static createShipment(req, callback, client = undefined, done = undefined) {
      // Ahoy, matey! Let's build a ship!
      // define some useful variables
      let store_id = req.body.store_id;
      let email = req.body.email;
      //let payment_nonce = req.body.payment_nonce;
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
        user.upsert((err) => {console.log(err)}, client, done);
      }

      callback(null, shipment, client, done);
  }  //  createShipment

  static doPayment(req, res, shipment, client = undefined, done = undefined) {

      let payment_nonce = req.body.payment_nonce
      return Store.get(req.body.store_id, (err, store) => {
        // set shipment source
        shipment.from_id = store.facility_id;
        shipment.to_id = '6ee01152-cc5e-49e7-97b7-d676ca7ff108';
        shipment.received = Math.round(new Date().getTime()/1000);
        // figure out payment
        let payments = [];
        let total_payments = 0;
        let total_price = 0;

        shipment.contents.recurseAssembly((component) => {
          if (component.props.price)
            total_price += parseFloat(component.props.price);
        });
        // if this is a store that we've already billed, just label as paid
        if (store.props.kiosk) {
          payments.push({type:"kiosk",price:total_price});
          total_payments += total_price;
        }
        // apply user credits if we can
        for (let i=0; i<shipment.contents.length; i++) {
          if (!shipment.contents[i].props) continue;
          if (!/Account balance/.test(shipment.contents[i].props.name)) continue;
          if ((shipment.contents[i].props.price*-1) > req.user.credits)
            return res.json({error: "User login error, try logging out and then back in"});
          // deduct user credits
          // TODO transaction me
          User.get(req.user.email, (err, user) => {
            user.credits += contents[i].props.price;
            user.upsert((err) => {console.log(err)}, client, done);
          });
        }
        // if it ain't free, charge for it
        if (total_price > total_payments) {
          // process payment
          payment_method.charge(payment_nonce, total_price-total_payments, (err, charge) => {
            if (err){
              console.log("NOES!!" + err);
              return res.status(403).json({error: err}).end();
            }
            // update payments, then save shipment
            payments.push({type: charge.type, price: charge.amount});
            shipment.payments = payments;
            // upsert shipment
            shipment.upsert((err)=> {
              if (err){
                console.log(err);
                return res.status(500).json({error: "Could not save shipment info"}).end();
              }
              // log that a purchase was made
              console.log(shipment.email + " purchased $"+total_price+" with "+charge.type);
              res.json({ok: "ok"}).end();
              // tell taxcloud about it
              TaxCloud.quote(shipment, (err, data) => {
                if (err) return console.log("Tax cloud error"+err);
                console.log("registering tax of "+data.tax+" with taxcloud");
                TaxCloud.authorizeWithCapture(data.customer_id, data.cart_id, data.order_id, (err, data) => {
                  if (err) return console.log("Tax cloud error"+err);
                });  //  TaxCloud.authorizeWithCapture
              });  // TaxCloud.quote
            }, client, done); // shipment.upsert()
          }); // payment_method.charge()
      }  //  end if
    }); // get store
    res.json({error: "invalid endpoint"}).end();
  }  // doPayment
} //  Order class

module.exports = Order;
