const Cart = require('../views/Cart.jsx');
const VssAdmin = require('../views/VssAdmin.jsx');
const Page = require('./Page.js');
const Item = require('./Item.js');
const Shipment = require('./Shipment.js');
const Component = require('./Component.js');
const SQLTable = require('./SQLTable.js');
const Inventory = require('./Inventory.js');

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

TODO: Explain stuff better
*/

class Vss{

    constructor(){
        // Hold relevant db id's
        this.id = {
            store : 'd955f9f3-e9ae-475a-a944-237862b589b3', // VSS store
            from : '5c637540-d460-4938-ac38-b6d283ea9a6d', // Man adjust facility
            to : '83bcecf8-6881-4202-bb1c-051f77f27d90' // VSS facility
        }
    }// constructor

    static callback(err, result){
      if (err){
        console.log(err);
        return Page.renderNotFound(req, res)
      }
      return result
    }

    static checkInventory(sku, callback){
        let vssFacility = '83bcecf8-6881-4202-bb1c-051f77f27d90';
        Inventory.get(vssFacility, (err, result) =>{
            let quantity = result["inventory"][sku]
            callback(err, result);
        });
    }

    static handleGET(req, res){
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
            let sku = req.query["sku"];
            Vss.checkInventory(sku, (err, quantity) => {
                if (err) {
                    console.log("ERROR checking Inventory")
                    return Page.renderNotFound(req, res)
                }
                if (quantity < 1) {
                    return Page.renderNotFound(req, res)
                }
                // Prep cart
                let cartProps = {
                  store: [{id: 'd955f9f3-e9ae-475a-a944-237862b589b3'}],
                  items: [{sku: sku, props: comp.props}],
                  //items: [{props: comp.props}],
                  ignoreWebCart: true,
                  is_cart: true
                }
                // Render cart
                return Cart.preprocessProps(cartProps, (err, options) => {
                    return Page.render(req, res, Cart, options);
                });  // Cart.preprocessProps()
            });  // Vss.checkInventory()
        });// Component.get()
    }

    static handlePOST(req, res){

        //facility id's
        var from_id = '5c637540-d460-4938-ac38-b6d283ea9a6d'; // Manual adjust
        var to_id = '83bcecf8-6881-4202-bb1c-051f77f27d90'; // VSS
        var store_id = 'd955f9f3-e9ae-475a-a944-237862b589b3'; // VSS store

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
