
const stripe = require('stripe')(process.env.STRIPE_SECRET);

const SQLTable = require('./SQLTable');
const Item = require('./Item');
const User = require('./User');
const Store = require('./Store');
const Shipment = require('./Shipment');
const Address = require('./Address');
const Log = require('./Log');

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

      let store_id = req.body.store_id;
      let email = req.body.email;
      let stripe_token = req.body.stripe_token;
      let contents = new Item(req.body.contents);
      let address = new Address(req.body.address);

      // TODO server-side order verification?
      // ensure tax and shipping at least

      let shipment = new Shipment({
        store_id,
        email,
        contents,
        address,
      });

      // reject orders for nothing
      if (!contents || !contents.length)
        return res.json({error: "Attempt to place empty order"});

      // if an image was uploaded, set the content's image to the resulting img
      if (req.file && req.file.location)
        order.contents.items[0].props.image = req.file.location;

      // if we got an email subscription, edit/create user
      if (req.body.email && typeof(req.body.contact_me)!='undefined') {
        let user = new User({email:req.body.email, props:{contact_me_kiosk:req.body.contact_me}});
        user.upsert((err)=>{console.log(err)});
      }

      // figure out payment
      return Store.get(req.body.store_id, (err, store) => {
        let total_price = 0;
        contents.recurseAssembly((component) => {
          if (component.props.price)
            total_price += component.props.price;
        });

        let payments = [];
        let total_payments = 0;
        if (store.props.kiosk) {
          payments.push({type:"kiosk",price:total_price});
          total_payments += total_price;
        }

        if (total_price > total_payments) {
          // charge stripe
          return stripe.charges.create({
            amount: (total_price - total_payments),
            currency: "usd",
            source: stripe_token,
            description: "Charge for "+email
          }, (err, charge) => {
            if (err) {
              return res.status(403).json({error: "Could not process credit transaction! "+err.message}).end();
            }
            if (!charge.paid) {
              return res.status(403).json({error: "Credit transaction denied "+charge.outcome.reason}).end();
            }

            // update payments, then save shipment
            payments.push({type: "stripe", price: charge.amount});
            shipment.payments = payments;
            shipment.upsert((err)=> {
              if (err)
                return res.status(500).json({error: "Could not save shipment info"}).end();

              Log.message(email+ " purchased "+total_price+" with stripe");

              res.json({ok: "ok"}).end();
            });
          }); // stripe charge
        }

        shipment.payments = payments;
        shipment.upsert((err)=> {
          if (err)
            return res.status(500).json({error: "Could not save shipment info"}).end();
          Log.message(email+ " purchased "+total_price+" (prepaid)");

          res.json({ok: "ok"}).end();
        });
      }); // get store
    }
    res.json({error: "invalid endpoint"}).end();
  }
}


module.exports = Order;
