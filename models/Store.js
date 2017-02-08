
const SQLTable = require('./SQLTable');
const Item = require('../models/Item.js');

class Store extends SQLTable {
  constructor(store) {
    super();
    this.id = store.id;
    this.facility_id = store.facility_id;
    this.products = new Item(store.products);
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "stores",
      pkey: "id",
      fields: ["facility_id","products"]
    };
  }

  static handleHTTP(req, res, next) {
    if (req.path_tokens[0]!='facility') {
      return next();
    }

    // user must be admin
    if (!req.user || req.user.roles.indexOf("bowanddrape")==-1)
      return Page.renderNotFound(req, res);

    res.json({error: "invalid endpoint"}).end();
  }
}

module.exports = Store;
