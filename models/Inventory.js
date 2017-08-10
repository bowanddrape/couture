
const SQLTable = require('./SQLTable');

/***
inventory is a view that queries through all shipments and tells you
what parts/components/products are at which facilities
***/
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

  static getInventory(facility_id, callback) {
      let sql = Inventory.getSQLSettings()
      Inventory.sqlTransaction((err, client) => {
        let query = `SELECT * FROM ${sql.tablename} WHERE ${sql.pkey}=$1 LIMIT 1`;
        client.query(query, [facility_id], (err, result) => {
          return callback(null, result["rows"][0]["inventory"])
        });
     });  //sqlTransaction
   }  //getInventory()
}  //Inventory

module.exports = Inventory;
