
const Store = require('./Store');
const Facility = require('./Facility');
const Shipment = require('./Shipment');
const Page = require('./Page');

const FulfillShipments = require('../views/FulfillShipments.jsx');
const GenericList = require('../views/GenericList.jsx');

/***
Handle requests to /fulfillment/
***/
class Fulfillment {

  static handleHTTP(req, res, next) {
    if (req.path_tokens[0]!='fulfillment') {
      return next();
    }

    // user must be logged in
    if (!req.user) {
      return Page.renderNotFound(req, res);
    }

    if (req.path_tokens.length == 1)
      return Fulfillment.handleList(req, res);

    if (req.method=="GET" && req.path_tokens.length == 2)
      return Fulfillment.handleGetDetails(req, res);

    res.json({error: "invalid endpoint"}).end();
  }

  static handleList(req, res) {
    // query for all stores that we have admin roles on
    let query = "SELECT * FROM stores WHERE props#>'{admins}'?|"+`array['${req.user.roles.join(",")}']`;
    Store.sqlQuery(Store, query, [], function(err, stores) {
      if (err) return res.status(500).end(err.toString());
      stores.map((store) => {
        store.href = `/fulfillment/${store.id}`;
      });
      Page.render(req, res, GenericList, {
        title: "Order Fulfillment",
        data: stores
      });
    });
  }

  static handleGetDetails(req, res) {
    Store.get(req.path_tokens[1], (err, store) => {
      if (err) return res.status(500).end(err.toString());
      if (!store) return Page.renderNotFound(req, res);
      // check permissions
      let authorized = store.props.admins.filter(function(role) {
        return req.user.roles.indexOf(role) != -1;
      });
      if (!authorized.length) {
        return Page.renderNotFound(req, res);
      }

      // get facilities
      // TODO put this in FulfillShipments::preprocessProps
      Facility.getAll({}, (err, facility_list) => {
        if (err || !facility_list.length)
          return Page.renderNotFound(req, res);
        // convert facilities list to array
        let facilities = {};
        facility_list.map((facility) => {
          facilities[facility.id] = facility;
        });

        // get pending outbound shipments
        Shipment.getAll({store_id:store.id, packed:null, received:null, page: {sort:"requested", direction:"ASC", limit:10}}, (err, pending_outbound_shipments) => {
          pending_outbound_shipments = pending_outbound_shipments ?
              pending_outbound_shipments : [];
          // this is a shipment, so all details are already fully hydrated
          Page.render(req, res, FulfillShipments, {
            store: store,
            facilities: facilities,
            pending_outbound_shipments: pending_outbound_shipments
          });
        });
      });
    }); // get store
  }
}
module.exports = Fulfillment;
