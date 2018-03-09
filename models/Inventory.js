
const SQLTable = require('./SQLTable');

const Page = require('./Page');
const Facility = require('./Facility');
const Component = require('./Component');
const MandateUserLogin = require('../views/MandateUserLogin.jsx');
const GenericList = require('../views/GenericList.jsx');
const ManageInventory = require('../views/ManageInventory.jsx');

/***
inventory is a view that queries through all shipments and tells you
what parts/components/products are at which facilities
***/
class Inventory extends SQLTable {
  constructor(store_inventory) {
    super();
    this.facility_id = store_inventory.facility_id;
    this.inventory = store_inventory.inventory;
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "inventory",
      pkey: "facility_id",
      fields: ["inventory"]
    };
  }

  static handleHTTP(req, res, next) {
    if (req.path_tokens[0]!='inventory')
      return next();

    // user must be logged in
    if (!req.user)
      return Page.render(req, res, MandateUserLogin, {});

    if (req.path_tokens.length == 1)
      return Inventory.handleListFacilities(req, res);

    if (req.method=="GET" && req.path_tokens.length == 2)
      return Inventory.handleShowInventory(req, res);

    res.json({error: "invalid endpoint"}).end();
  }

  static handleListFacilities(req, res) {
    Facility.getList(req.user, (err, facilities) => {
      if (err) return res.status(500).end(err.toString());
      facilities.map((facility) => {
        facility.href = `/inventory/${facility.id}`;
      });
      Page.render(req, res, GenericList, {
        title: "Select Facility",
        data: facilities
      });
    });
  }

  static handleShowInventory(req, res) {
    Facility.get(req.path_tokens[1], (err, facility) => {
      if (err) return res.status(500).end(err.toString());
      if (!facility) return Page.renderNotFound(req, res);
      // check permissions
      let authorized = facility.props.admins.filter(function(role) {
        return req.user.roles.indexOf(role) != -1;
      });
      if (!authorized.length) {
        return Page.renderNotFound(req, res);
      }

      Inventory.get(req.path_tokens[1], (err, inventory) => {
        inventory = inventory || {};
        Component.getAll({}, (err, components) => {
          Page.render(req, res, ManageInventory, {
            inventory:inventory.inventory,
            facility,
            components
          });
        });
      });
    });
  }
}

module.exports = Inventory;
