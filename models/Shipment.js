
const SQLTable = require('./SQLTable');
const Item = require('./Item');

class Shipment extends SQLTable {
  constructor(shipment) {
    super();
    Object.assign(this, shipment);
    if (this.contents)
      this.contents = new Item(this.contents);
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "shipments",
      pkey: "id",
      fields: ["from_id", "to_id", "order_id", "contents", "sent", "received", "tracking_code"]
    };
  }
}

module.exports = Shipment;
