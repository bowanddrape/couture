const Cart = require('../views/Cart.jsx');
const VssAdmin = require('../views/VssAdmin.jsx');
const Page = require('./Page.js');
const Item = require('./Item');
const Shipment = require('./Shipment');

/*
 ██████╗  ██████╗ ██╗    ██╗       ██╗       ██████╗ ██████╗  █████╗ ██████╗ ███████╗
 ██╔══██╗██╔═══██╗██║    ██║       ██║       ██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔════╝
 ██████╔╝██║   ██║██║ █╗ ██║    ████████╗    ██║  ██║██████╔╝███████║██████╔╝█████╗
 ██╔══██╗██║   ██║██║███╗██║    ██╔═██╔═╝    ██║  ██║██╔══██╗██╔══██║██╔═══╝ ██╔══╝
 ██████╔╝╚██████╔╝╚███╔███╔╝    ██████║      ██████╔╝██║  ██║██║  ██║██║     ███████╗
 ╚═════╝  ╚═════╝  ╚══╝╚══╝     ╚═════╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚══════╝

Author: Renee Beauvoir
Date: Summer 2017

The Virtual Sample Sale (VSS) class is responsible for managing the creation and
display of products sold as part of Instagram sample sales.

TODO: Explain stuff better
*/

class Vss{

    static handleHTTP(req, res, next){

      // Hardcoded VSS store id
      var store_id = 'd955f9f3-e9ae-475a-a944-237862b589b3';

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

            
            return Page.render(req, res, Cart, {
                store: [{ id: store_id }]});
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
          //Pull from the body and add to a new Shipment
          let contents = new Item(req.body);
          let shipment = new Shipment({
            store_id,
            contents,
          });
          //error handling of contents and shipment

          //upsert to db
          shipment.upsert((err)=> {
            if (err)
              return res.status(500).json({error: "Could not save shipment info"}).end();
            res.json({ok: "ok", shipment: shipment}).end();
          }); // shipment.upsert()
        }
      }
  }

module.exports=Vss;
