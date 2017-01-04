
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
}

module.exports = Store;
