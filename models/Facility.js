
const async = require('async');
const SQLTable = require('./SQLTable');

/***
A Facility is a source or sink for Components and products

This can designate either a raw materials vendor, a manufacturing facility that
consumes one part and emits another, or an endpoint for tracking the endstate of
a part/product (such as delivered or destroyed)
They do not have to correspond to specific physical locations
***/
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
