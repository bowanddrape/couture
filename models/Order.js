

const SQLTable = require('./SQLTable');
const Item = require('./Item');
const User = require('./User');
const Store = require('./Store');
const Shipment = require('./Shipment');
const Address = require('./Address');
const Log = require('./Log');
const TaxCloud = require('./TaxCloud');
const Facility = require('./Facility');
const ShipProvider = require('./ShipProvider.js');
const Signup = require('./Signup');

//const payment_method = require('./PayStripe.js');
const payment_method = require('./PayBraintree.js');

/***
Handle requests to the endpoints "/order/"
***/
class Order {

  static handleHTTP(req, res, next) {
    if (req.path_tokens[0]!='order') {
      return next();
    }
    if (req.method!='POST') {
      return res.json({error: "invalid endpoint"}).end();
    }

    if (typeof(req.body.contents)=='string') {
      try {
        req.body.contents = JSON.parse(req.body.contents);
      } catch (err) {
        return res.json({error: "Malformed payload"});
      }
    }

    let store_id = req.body.store_id;
    let email = req.body.email;
    let payment_nonce = req.body.payment_nonce;
    let contents = new Item(req.body.contents);
    let address = new Address(req.body.address);

    if (!Signup.isEmail(email))
      return res.json({error: "Please enter an email address"});

    // TODO server-side order verification?
    // ensure tax and shipping at least

    let shipment = new Shipment({
      store_id,
      email,
      contents,
      address,
      billing_address: new Address(req.body.billing_address),
      delivery_promised: req.body.delivery_promised,
      ship_by: req.body.ship_by,
    });

    // reject orders for nothing
    if (!shipment.contents || !shipment.contents.length)
      return res.json({error: "Attempt to place empty order"});

    // if an image was uploaded, set the content's image to the resulting img
    if (req.files && req.files[0] && req.files[0].location)
      shipment.contents.items[0].props.image = req.files[0].location;

    // if we got an email subscription, edit/create user
    if (req.body.email && typeof(req.body.contact_me)!='undefined') {
      let user = new User({email:req.body.email, props:{contact_me_kiosk:req.body.contact_me}});
      user.upsert((err)=>{console.log(err)});
    }

    return Store.get(req.body.store_id, (err, store) => {
      if (err || !store)
        return res.json({error: "Cart not properly linked to store"});
      // set shipment destination
      shipment.to_id = Facility.special_ids.customer_ship;
      shipment.from_id = store.facility_id;
      let handleCheckInventory = (client, callback) => {
        // TODO in the future, let SQLTable.get take in an optional pg client
        // until then, just run straight sql commands
        // (we'll need to pass "client" into callback then)
        let query = `SELECT inventory FROM inventory WHERE facility_id=$1 LIMIT 1`;
        client.query(query, [shipment.from_id], (err, result) => {
          if (err) return callback(err);
          let out_of_stock_skus = [];
          // grab map of facility's inventory
          let facility_skus = {};
          if (result && result.rows.length)
            facility_skus = result.rows[0].inventory;
          // walk through this shipment and get the total map of skus consumed
          let shipment_skus = {};
          shipment.contents.recurseAssembly((component) => {
            if (!component.sku) return;
            let quantity = component.quantity || 1;
            shipment_skus[component.sku] = shipment_skus[component.sku] || 0;
            shipment_skus[component.sku] += quantity;
          });
          // see if we have enough inventory to fulfill this shipment
          for (let sku in shipment_skus) {
            // well this should never happen, but just ignore it if it does
            if (!shipment_skus[sku] || shipment_skus[sku]<0) return;
            // compare inventory quantities
            if (!facility_skus[sku] || shipment_skus[sku]>facility_skus[sku]) {
              out_of_stock_skus.push(sku);
            }
          }
          // depending on the store, we may want to allow/deny overselling
          if (out_of_stock_skus.length && !store.props.oversell) {
            return callback(`The following skus are OutOfStock: ${out_of_stock_skus.join(", ")}`);
          }
          callback(null);
        }); // query inventory
      } // define handleCheckInventory

      let handlePayment = (callback) => {
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
            return callback("User login error, try logging out and then back in");
          // deduct user credits
          // TODO transaction me
          User.get(req.user.email, (err, user) => {
            user.credits += shipment.contents[i].props.price;
            user.upsert();
          });
        }

        // if it ain't free, charge for it
        if (total_price > total_payments) {
          // process payment
          let charge_amount = (Math.round((total_price-total_payments)*100)/100);
          return payment_method.charge(shipment, payment_nonce, charge_amount, (err, charge) => {
            if (err) return callback(err);
            // update payments, then save shipment
            payments.push({type: charge.type, price: charge.amount});
            shipment.payments = payments;
            callback(null, shipment);
          }); // payment_method.charge()
        }
        // otherwise just carry on
        callback(null, shipment);
      } // define handlePayments()

      let handleCreateShipment = (client, callback) => {
        // go through each order item and add default tags
        // TODO organize this somewhere
        shipment.contents.forEach((item) => {
          if (!item.sku) return;
          let needs_embroidery = false;
          let needs_airbrush = false;
          // see if we have any embroidery
          // TODO flag each component with manufacturing reqirements
          item.recurseAssembly((component) => {
            if (/letter_embroidery/.test(component.sku)) needs_embroidery = true;
            if (/letter_airbrush/.test(component.sku)) needs_airbrush = true;
          });
          item.tags = item.tags || [];
          if (needs_embroidery)
            item.tags.push("needs_embroidery");
          else if (needs_airbrush)
            item.tags.push("needs_airbrush");
          else
            item.tags.push("new");
        });

        let upsert = shipment.buildUpsertQuery();
        client.query(upsert.query, upsert.values, (err, result) => {
          if (err) return callback("Could not save shipment info");
          if (result && result.rows)
            shipment.id = result.rows[0].id;
          // success!
          callback(null, shipment);

          // log that a purchase was made
          console.log(`${email} purchased ${shipment.id}`);

          // tell taxcloud about it
          TaxCloud.quote(shipment, (err, data) => {
            if (err) return console.log("Tax cloud error"+err);
            console.log("registering tax of "+data.tax+" with taxcloud");
            TaxCloud.authorizeWithCapture(data.customer_id, data.cart_id, data.order_id, (err, data) => {
              if (err) return console.log("Tax cloud error"+err);
            });
          });

          // flag user has having made this purchase
          let user = new User({email});
          user.props.latest_purchase = Math.floor(new Date().getTime()/1000);
          user.upsert(()=>{});
        }); // shipment.upsert()
      } // define handleCreateShipment()

      let tasks = [];
      // first check inventory
      tasks.push((client, callback) => {
        handleCheckInventory(client, (err) => {
          callback(err, client);
        });
      });
      // then charge if we have to
      tasks.push((client, callback) => {
        handlePayment((err) => {
          callback(err, client);
        });
      });
      // finally, place the order
      tasks.push((client, callback) => {
        handleCreateShipment(client, (err, shipment) => {
          callback(err, client, shipment);
        });
      });
      // we're done! go respond to the web request that we're good
      tasks.push((client, shipment, callback) => {
        res.json({ok: "ok", shipment}).end();
        callback(null);
      });
      let onError = (err) => {
        console.log("error placing order:" + err);
        // custom error message for VSS cart
        if (/OutOfStock/.test(err) && new RegExp("vss","i").test(store.props.name)) {
          err = "Just missed it! Someone already purchased this Sample Sale item ಥ_ಥ";
        }
        res.json({error: err}).end();
      }

      // run all the functions we just set up
      SQLTable.sqlExecTransaction(tasks, onError);

    }); // get store
  }
}


module.exports = Order;
