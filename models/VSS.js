const Cart = require('../views/Cart.jsx');
const VSSAdmin = require('../views/VSSAdmin.jsx');
const Page = require('./Page.js');
const Item = require('./Item.js');
const Shipment = require('./Shipment.js');
const Component = require('./Component.js');
const SQLTable = require('./SQLTable.js');
const Inventory = require('./Inventory.js');
const Facility = require('./Facility.js');
const Store = require('./Store.js');

/*
██╗   ██╗███████╗███████╗
██║   ██║██╔════╝██╔════╝
██║   ██║███████╗███████╗
╚██╗ ██╔╝╚════██║╚════██║
 ╚████╔╝ ███████║███████║
  ╚═══╝  ╚══════╝╚══════╝

Bow & Drape Engineering Group
Author: Renee Beauvoir

The Virtual Sample Sale (VSS) class is responsible for managing the creation and
display of products sold as part of Instagram sample sales.

*/

class VSS {

  static handleGET(req, res) {

    // Manages all GET requests to /vss
    // Check for required query string
    if (!req.query || !req.query.sku)
      return Page.renderNotFound(req, res)
    let sku = req.query["sku"];

    // Grab a component representing the item to be sold
    Component.get(sku, (err, comp) => {
      if (err)
        return Page.renderNotFound(req, res)

      // Check if we have inventory before rendering cartProps
      Inventory.get(Facility.special_ids.vss, (err, results) => {
        // Do stuff in here that depends on positive inventory
        if (err) {
          console.log("ERROR checking inventory "+err);
          return Page.renderError(req, res)
        }
        // TODO: Have 0 inventory instances redirect to a custom page
        if (results.inventory[sku] < 1) {
          return res.end("Just missed it! Someone already grabbed this item");
        }
        //  Prep cart
        let cartProps = {
          store: [{id: Store.special_ids.vss}],
          items: [{sku: sku, props: comp.props}],
          ignoreWebCart: true,
          is_cart: true
        }
        // Render cart
        return Cart.preprocessProps(cartProps, (err, options) => {
          return Page.render(req, res, Cart, options);
        });  // Cart.preprocessProps()
      });  //  Inventory.getInventory
    });// Component.get()
  }  //  handleGET()

  static handlePOST(req, res) {

    //facility id's
    var from_id = Facility.special_ids.manual_adjust;
    var to_id = Facility.special_ids.vss;
    var store_id = Store.special_ids.vss;

    if (typeof(req.body) == 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch (err) {
        console.log(err);
        return res.json({error: "Malformed payload"});
      }
    }
    // Create a new shipment and component
    let received = Math.round(new Date().getTime()/1000);
    let newComponent = new Component(req.body);
    let contents = new Item(req.body);
    let shipment = new Shipment({
      from_id,
      to_id,
      store_id,
      contents,
      received,
    });
    // Upsert to component and shipment tables
    newComponent.upsert((err, result) => {
      shipment.upsert((err, result)=> {
        if (err)
          return res.status(500).json({error: "Could not save shipment info"}).end();
        res.json({ok: "ok", shipment: shipment}).end();
      }); // shipment.upsert()
    }); // newComponent.upsert()
  }

  static handleHTTP(req, res, next){
    // only handle this request if it's for us
    if (!req.path_tokens.length || req.path_tokens[0].toLowerCase()!=='vss')
      return next();

    // Handle VSS cart
    if (req.path_tokens.length==1 && req.method == 'GET')
      return VSS.handleGET(req, res);

    // user must be admin
    if (!req.user || req.user.roles.indexOf("bowanddrape")==-1)
      return Page.renderNotFound(req, res);

    // goto www.bowanddrape.com/vss/admin
    if (req.path_tokens.length > 1 && req.path_tokens[1].toLowerCase() === 'admin')
      return Page.render(req, res, VSSAdmin, {});

    // Check for GET or POST to www.bowanddrape.com/vss/
    if (req.method == 'POST')
      return VSS.handlePOST(req, res);  //handle POST request

    return next();
  }
}

module.exports = VSS;
