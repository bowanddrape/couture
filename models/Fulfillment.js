
const Store = require('./Store');
const Shipment = require('./Shipment');
const Page = require('./Page');

const MandateUserLogin = require('../views/MandateUserLogin.jsx');
const FulfillShipments = require('../views/FulfillShipments.jsx');
const GenericList = require('../views/GenericList.jsx');
const FulfillmentStation = require('../views/FulfillmentStation.jsx');

const station_types = ["picking","pressing","qaing","packing"];

/***
Handle requests to /fulfillment/
***/

class Fulfillment {

  static handleHTTP(req, res, next) {
    if (req.path_tokens[0]!='fulfillment') {
      return next();
    }

    if (req.method=="GET" && req.path_tokens.length == 3)
      return Fulfillment.handleGetStation(req, res);

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

  static handleGetStation(req, res){
    req.query.layout = "basic";

    // user must be logged in
    if (!req.user) {
      return Page.render(req, res, MandateUserLogin, {});
    }

    let store_id = req.path_tokens[1];
    // Check for a valid station type
    let station_type = req.path_tokens[2].toLowerCase();
    let isValid = (station_types.indexOf(station_type) > -1);

    if (isValid){
      return Page.render(req, res, FulfillmentStation, {
        user: req.user,
        station: station_type,
      });
    } else {
      return Page.renderNotFound(req, res);
    }
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

      FulfillShipments.preprocessProps({
        store: store,
        station_types,
      }, (err, props) => {
        Page.render(req, res, FulfillShipments, props);
      });
    }); // get store
  }
}
module.exports = Fulfillment;
