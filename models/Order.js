
const SQLTable = require('./SQLTable');
const Item = require('./Item');
const User = require('./User');
const Shipment = require('./Shipment');

class Order extends SQLTable {
  constructor(order) {
    super();
    Object.assign(this, order);
    if (this.contents) {
      this.contents = new Item(this.contents);
    }
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "orders",
      pkey: "id",
      fields: ["store_id", "email", "contents", "props", "payments"]
    };
  }

  static handleHTTP(req, res, next) {
    if (req.path_tokens[0]!='order') {
      return next();
    }
    if (req.method=='POST') {
      // TODO server-side order verification?

      if (typeof(req.body.contents)=='string') {
        try {
          req.body.contents = JSON.parse(req.body.contents);
        } catch (err) {
          return res.json({error: "Malformed payload"});
        }
      }

      let order = new Order(req.body);

      // reject orders for nothing
      if (!order.contents || !order.contents.items.length)
        return res.json({error: "Attempt to place empty order"});

      // if an image was uploaded, set the content's image to the resulting img
      if (req.file && req.file.location)
        order.contents.items[0].props.image = req.file.location;

      // if we got an email subscription, edit/create user
      if (req.body.email && typeof(req.body.contact_me)!='undefined') {
        let user = new User({email:req.body.email, props:{contact_me_kiosk:req.body.contact_me}});
        user.upsert((err)=>{console.log(err)});
      }
      // TODO add payment

      return order.upsert((err, result) => {
        if (err) {
          console.log(err);
          return res.json({error: "Could not create order"});
        }

        // add shipment detail
        let shipment = new Shipment({
          order_id: result.rows[0].id,
          from_id: req.body.facility_id,
          contents: req.body.contents
        });
        shipment.upsert((err)=> {
          if (err) console.log(err);
          res.json({ok: "ok"}).end();
        });
      })
    }
    res.json({error: "invalid endpoint"}).end();
  }
}


module.exports = Order;
