const Cart = require('../views/Cart.jsx');
const VssAdmin = require('../views/VssAdmin.jsx');
const Page = require('./Page.js');
const Item = require('./Item');
const Shipment = require('./Shipment');

class Vss{

    static handleHTTP(req, res, next){

      if(req.path_tokens.length < 1)
        return next();
      if(req.path_tokens[0].toLowerCase() !== 'vss')
        return next();
      //goto vss/admin
      if(req.path_tokens.length > 1 && req.path_tokens[1].toLowerCase() === 'admin')
        return Page.render(req, res, VssAdmin, {});
      //handle POST request from vss/admin
      if (req.method == 'POST'){
          console.log(req.body);
          if (typeof(req.body) == 'string') {
              try {
                  req.body = JSON.parse(req.body);
              } catch (err) {
                  console.log(err);
                  return res.json({error: "Malformed payload"});
              }
          }

          //Hardcoded vss store_id
          let store_id = 'd955f9f3-e9ae-475a-a944-237862b589b3';
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
            // log that a new vss item has been added
            console.log("Uploaded");
            res.json({ok: "ok"}).end();
          }); // shipment.upsert()

          //return vss url that directs to a cart
      }

      //goto vss page
      return Page.render(req, res, Cart, {
          store: [{id: 'd955f9f3-e9ae-475a-a944-237862b589b3'}]});
      }
}
module.exports=Vss;
