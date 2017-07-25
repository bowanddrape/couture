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

    static handleHTTP(req, res, next){

      var store_id = 'd955f9f3-e9ae-475a-a944-237862b589b3';  // VSS store
      var from_id = '5c637540-d460-4938-ac38-b6d283ea9a6d';  //  Man adjust facility
      var to_id = '83bcecf8-6881-4202-bb1c-051f77f27d90';  //  VSS facility

      // Skip if nothing after '/'
      // ex: www.bowanddrape.com/
      if(req.path_tokens.length < 1)
        return next();
      // Skip if we're going to any page other than '/'
      // ex: www.bowanddrape.com/someOtherPage
      if(req.path_tokens[0].toLowerCase() !== 'vss')
        return next();
      // goto www.bowanddrape.com/vss/admin
      if(req.path_tokens.length > 1 && req.path_tokens[1].toLowerCase() === 'admin')
        return Page.render(req, res, VssAdmin, {});

      // Check for GET or POST to www.bowanddrape.com/vss/
      if(req.path_tokens[0].toLowerCase() == 'vss')
        // Handle GET request
        if (req.method == 'GET'){
            // Check for a query string
            if (Object.keys(req.query).length < 1)
                return Page.renderNotFound(req, res)
            // Get cart stuff from table
            Component.get(req.query["sku"], (err, result) => {
                if (err){
                    console.log("Error: " + err);
                    return Page.renderNotFound(req, res)
                }
                // Check for a null result if no sku, props were found in the table
                if (result){
                  //  Error check, don't render a cart if someone already ordered it
                  Inventory.get(to_id, (err, quantities => {
                      if (err){
                          console.log("Error: " + err);
                      }
                      // Check results for inventory quantity
                      console.log("Inventory");
                      console.log(quantities);
                  }));

                  //return Page.renderNotFound(req, res)

                  //  Nobody ordered it yet, make a cart, YAY!
                  return Page.render(req, res, Cart, {
                    store: [ { id: store_id } ],
                    items: [{props: result.props}],
                    ignoreWebCart: true,
                  });
                }
                // Return 404 if no component was found matching the sku
                return Page.renderNotFound(req, res)
            }); // Component.get()
        }

        //handle POST request
        if (req.method == 'POST'){
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
      }
  }

module.exports=Vss;
