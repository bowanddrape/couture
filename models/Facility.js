
const SQLTable = require('./SQLTable');

class Facility extends SQLTable {
  constructor(facility) {
    super();
    Object.assign(this, facility);
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "facilities",
      pkey: "id",
      fields: ["store_id", "email", "contents", "props", "payments"]
    };
  }

}

module.exports = Facility;
