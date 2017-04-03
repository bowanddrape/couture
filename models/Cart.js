
const JSONAPI = require('./JSONAPI');
const Item = require('./Item');

class Cart extends JSONAPI {
  constructor(shipment) {
    super();
    Object.assign(this, shipment);
    if (this.contents)
      this.contents = new Item(this.contents);
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "cart",
      pkey: "id",
      fields: ["email", "store_id", "contents"]
    };
  }

  // TODO if I enable multi-column primary keys, this won't be needed
  onApiSave(req, res, object, callback) {
    if (!object.email || !object.store_id) {
      let error = {error: "payload missing key fields"};
      if (callback) callback(error);
      return res.status(404).json(error).end();
    }
    let constraint = {email: object.email, store_id: object.store_id};
    // get and update if a cart already exists
    Cart.getAll(constraint, (err, carts) => {
      let cart = (carts && carts.length) ? carts[0] : new Cart(constraint);
      cart.contents = object.contents || new Item();
      cart.upsert((err, result) => {
        if (callback)
          return (callback(err, result));
        if (err)
          return res.json({error: err});
        return res.json(cart);
      });
    }); // get cart for email and store
  }

}

module.exports = Shipment;
