const Cart = require('../views/Cart.jsx');
const VssAdmin = require('../views/VssAdmin.jsx');
const Page = require('./Page.js');
const Item = require('./Item.js');
const Shipment = require('./Shipment.js');
const Component = require('./Component.js');
const SQLTable = require('./SQLTable.js');
const Inventory = require('./Inventory.js');
const IDS = require('./FacilityIDS.js');

/*
██╗   ██╗███████╗███████╗
██║   ██║██╔════╝██╔════╝
██║   ██║███████╗███████╗
╚██╗ ██╔╝╚════██║╚════██║
 ╚████╔╝ ███████║███████║
  ╚═══╝  ╚══════╝╚══════╝

Bow & Drape Engineering Group
Author: Renee Beauvoir
Date: Summer 2017

The Virtual Sample Sale (VSS) class is responsible for managing the creation and
display of products sold as part of Instagram sample sales.

TODO: Explain stuff more betterer
*/

class Vss{

    static handleGET(req, res){

        // Manages all GET requests to /vss
        // Check for required query string
        if (Object.keys(req.query).length < 1)
            return Page.renderNotFound(req, res)

        // Grab a component representing the item to be sold
        Component.get(req.query["sku"], (err, comp) => {
            if (err) {
              console.log(error);
              return Page.renderNotFound(req, res)
            }
            // Check if we have inventory before rendering cartProps
            Inventory.getInventory(IDS.vssFacility, (err, results) => {
                //  Do stuff in here that depends on positive inventory
                // TODO: Have 0 inventory instances redirect to a custom page
                let sku = req.query["sku"];

                if (err) {
                    console.log("ERROR checking inventory");
                    return Page.renderNotFound(req, res)
                }
                if (results[sku] < 1) {
                    console.log("No inventory for item")
                    return Page.renderNotFound(req, res)
                }
                //  Prep cart
                let cartProps = {
                  store: [{id: IDS.vssStore}],
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

    static handlePOST(req, res){

        //facility id's
        var from_id = IDS.manual_adjust;
        var to_id = IDS.vssFacility;
        var store_id = IDS.vssStore;

        if (typeof(req.body) == 'string') {
            try {
                req.body = JSON.parse(req.body);
            } catch (err) {
                console.log(err);
                return res.json({error: "Malformed payload"});
            }
        }
        //error handling of contents and shipment
        // Create a new shipment and component
        let received = Math.round(new Date().getTime()/1000);
        let newComponent = new Component(req.body);
        let contents = new Item(req.body);
        let shipment = new Shipment({
          from_id,
          to_id,
          store_id,
          contents,
          received
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
      // Skip if nothing after '/' ( ex: www.bowanddrape.com/ )
      if(req.path_tokens.length < 1)
        return next();
      // Skip if we're going to '/vss' ( ex: www.bowanddrape.com/someOtherPage )
      if(req.path_tokens[0].toLowerCase() !== 'vss')
        return next();
      // user must be admin
      if (!req.user || req.user.roles.indexOf("bowanddrape")==-1)
        return Page.renderNotFound(req, res);
      // goto www.bowanddrape.com/vss/admin
      if(req.path_tokens.length > 1 && req.path_tokens[1].toLowerCase() === 'admin')
        return Page.render(req, res, VssAdmin, {});
      // Check for GET or POST to www.bowanddrape.com/vss/
      if(req.path_tokens[0].toLowerCase() == 'vss'){
        if (req.method == 'GET') Vss.handleGET(req, res);  // Handle GET request
        if (req.method == 'POST') Vss.handlePOST(req, res);  //handle POST request
      }
    }
}

module.exports=Vss;
