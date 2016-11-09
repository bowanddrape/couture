
const SQLTable = require('./SQLTable');

class Inventory extends SQLTable {
  constructor(store_inventory) {
    super();
    this.facility_id = store_inventory.facility_id;
    this.inventory = store_inventory.inventory;
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "inventory",
      pkey: "facility_id",
      fields: ["inventory"]
    };
  }
}

module.exports = Inventory;
