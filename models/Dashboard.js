
const Page = require('./Page.js');
const Shipment = require('./Shipment.js');
const SQLTable = require('./SQLTable.js');
const async = require('async');

const DashboardHome = require('../views/DashboardHome.jsx');
const DashboardPromos = require('../views/DashboardPromos.jsx');
const DashboardMetrics = require('../views/DashboardMetrics.jsx');
const ExportOrders = require('../views/ExportOrders.jsx');

class Dashboard {

  static handleHTTP(req, res, next){
    // only handle this request if it's for us
    if (!req.path_tokens.length || req.path_tokens[0].toLowerCase()!=='dashboard')
      return next();

    // user must be admin
    if (!req.user || req.user.roles.indexOf("bowanddrape")==-1)
      return Page.renderNotFound(req, res);

    if (req.path_tokens[1] == "export_orders") {
      return ExportOrders.preprocessProps(req.query, (err, props) => {
        Page.render(req, res, ExportOrders, props);
      });
    }

    if (req.path_tokens[1] == "metrics") {
      return DashboardMetrics.preprocessProps(req.query, (err, props) => {
        Page.render(req, res, DashboardMetrics, props);
      });
    }

    if (req.path_tokens[1] == "promos") {
      return DashboardPromos.preprocessProps(req.query, (err, props) => {
        Page.render(req, res, DashboardPromos, props);
      });
    }

    return DashboardHome.preprocessProps(req.query, (err, props) => {
      Page.render(req, res, DashboardHome, props);
    });
  }
}

module.exports = Dashboard;
