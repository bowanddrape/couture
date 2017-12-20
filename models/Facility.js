
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

// keep around some common constant special ids so we don't have to do a db
// lookup each time
// TODO cache things and look things up from cache instead
Facility.special_ids = {
  216: '988e00d0-4b27-4ab4-ac00-59fcba6847d1',
  customer_ship: '6ee01152-cc5e-49e7-97b7-d676ca7ff108',
  manual_adjust : '5c637540-d460-4938-ac38-b6d283ea9a6d',
  vss : '83bcecf8-6881-4202-bb1c-051f77f27d90',
  canceled: 'e03d3875-d349-4375-8071-40928aa625f5',
};

module.exports = Facility;
