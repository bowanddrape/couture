
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

  // ensure that certain facilities exist and remember their ids in env
  static initMandatoryFacilities(callback) {
    let facility_names = [
      "customer_ship",
      "customer_pickup",
      "canceled",
      "returned",
      "manual_adjustment",
    ];
    let facility_tasks = [];
    facility_names.forEach((name) => {
      facility_tasks.push(
        function(callback) {
          let query = `SELECT * FROM facilities WHERE props#>>'{name}'=$1 LIMIT 1;`;
          SQLTable.sqlQuery(Facility, query, [name], (err, facilities) => {
            if (err) return callback(err);
            // if we found it, remember it
            if (facilities && facilities.length) {
              return callback(null, [name, facilities[0].id]);
            }
            // otherwise make a new one
            let facility = new Facility({props:{name}});
            facility.upsert((err, ret) => {
              if (err) return console.log(err);
              return callback(null, [name, ret.rows[0].id]);
            });
          }); // query facilities
        }
      );
    });
    async.parallel(facility_tasks, (err, ret) => {
      if (err) console.log(err);
      let facility_ids = {};
      ret.forEach((name_val) => {
        facility_ids[name_val[0]] = name_val[1];
      });
      process.env.facility_ids = JSON.stringify(facility_ids);
      if (callback)
        callback(err, facility_ids);
    });
  }
}

module.exports = Facility;
