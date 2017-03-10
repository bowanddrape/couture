
const JSONAPI = require('./JSONAPI');
const Item = require('./Item');
const Page = require('./Page');

class Shipment extends JSONAPI {
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
      fields: ["from_id", "to_id", "contents", "requested", "packed", "received", "store_id", "email", "props", "payments", "tracking_code"]
    };
  }

}

module.exports = Shipment;
