
const async = require('async');
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
      fields: ["props", "address"]
    };
  }

}

module.exports = Facility;
