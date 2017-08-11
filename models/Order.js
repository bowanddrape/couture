

const SQLTable = require('./SQLTable');
const Item = require('./Item');
const User = require('./User');
const Store = require('./Store');
const Shipment = require('./Shipment');
const Address = require('./Address');
const Log = require('./Log');
const TaxCloud = require('./TaxCloud');

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

      // reject orders for nothing
      if (!contents || !contents.length)
        return res.json({error: "Attempt to place empty order"});

      // if an image was uploaded, set the content's image to the resulting img
      if (req.files && req.files[0] && req.files[0].location)
        order.contents.items[0].props.image = req.files[0].location;

      // if we got an email subscription, edit/create user
      if (req.body.email && typeof(req.body.contact_me)!='undefined') {
        let user = new User({email:req.body.email, props:{contact_me_kiosk:req.body.contact_me}});
        user.upsert((err)=>{console.log(err)});
      }

      return Store.get(req.body.store_id, (err, store) => {
        // set shipment source
        shipment.from_id = store.facility_id;

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

        // apply user credits if we can
        for (let i=0; i<contents.length; i++) {
          if (!contents[i].props) continue;
          if (!/Account balance/.test(contents[i].props.name)) continue;
          if ((contents[i].props.price*-1) > req.user.credits)
            return res.json({error: "User login error, try logging out and then back in"});
          // deduct user credits
          // TODO transaction me
          User.get(req.user.email, (err, user) => {
            user.credits += contents[i].props.price;
            user.upsert();
          });
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
                });
              });

            }); // shipment.upsert()
          }); // payment_method.charge()
        }
      }); // get store
    }
    res.json({error: "invalid endpoint"}).end();
  }
}


module.exports = Order;
