
const SQLTable = require('./SQLTable');
const Item = require('./Item');
const Shipment = require('./Shipment');
const Page = require('./Page');

const View = require('../views/Facility.jsx');

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

  static handleHTTP(req, res, next) {
    if (req.path_tokens[0]!='facility') {
      return next();
    }

    // user must be logged in
    if (!req.user) {
      return Page.renderNotFound(req, res);
    }

    if (req.path_tokens.length == 1)
      return Facility.handleList(req, res);

    if (req.method=="GET" && req.path_tokens.length == 2)
      return Facility.handleGetDetails(req, res);

    res.json({error: "invalid endpoint"}).end();
  }

  static handleList(req, res) {
    // query for all facilities that we have admin roles on
    let query = "SELECT * FROM facilities WHERE facilities.props#>'{admins}'?|"+`array['${req.user.roles.join(",")}']`;
    Facility.sqlQuery(Facility, query, [], function(err, facilities) {
      if (err) return res.status(500).end(err.toString());
      res.end(JSON.stringify(facilities));
    });
  }

  static handleGetDetails(req, res) {
    // get facilities
    Facility.getAll({}, (err, facility_list) => {
      if (err || !facility_list.length)
        return Page.renderNotFound(req, res);
      // convert facilities list to array
      let facilities = {};
      facility_list.map((facility) => {
        facilities[facility.id] = facility;
      });

      let facility = facilities[req.path_tokens[1]];
      if (!facility)
        return Page.renderNotFound(req, res);
      // check permissions
      let authorized = facility.props.admins.filter(function(role) {
        return req.user.roles.indexOf(role) != -1;
      });
      if (!authorized.length) {
        return Page.renderNotFound(req, res);
      }

      // get pending outbound shipments
      Shipment.getAll({from_id:facility.id, packed:null, received:null, page: {sort:"requested", direction:"ASC", limit:10}}, (err, pending_outbound_shipments) => {
        pending_outbound_shipments = pending_outbound_shipments ?
            pending_outbound_shipments : [];
        // this is a shipment, so all details are already fully hydrated
        Page.render(req, res, View, {
          facility: facility,
          facilities: facilities,
          pending_outbound_shipments: pending_outbound_shipments
        });
      });
    });
  }
}


module.exports = Facility;
