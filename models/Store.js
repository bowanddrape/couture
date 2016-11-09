
const SQLTable = require('./SQLTable');
const Item = require('../models/Item.js');

class Store extends SQLTable {
  constructor(store) {
    super();
    this.id = store.id;
    this.facility_id = store.facility_id;
    this.products = store.products;
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "stores",
      pkey: "id",
      fields: ["facility_id","products"]
    };
  }

  // extends SqlTable
  static sqlQuery(model, query, values, callback) {
    // also make products of class Item
    super.sqlQuery(model, query, values, function(err, result) {
      if (err) return err;
      console.log(result);
      result.forEach(function(row) {
        row.products = new Item(row.products);
      });
      callback(err, result);
    });
  }
}

module.exports = Store;
