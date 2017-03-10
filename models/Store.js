
const SQLTable = require('./SQLTable');
const Item = require('./Item.js');
const Page = require('./Page.js');
const GenericList = require('../views/GenericList.jsx');
const View = require('../views/Store.jsx');
const ProductList = require('../views/ProductList.jsx')

class Store extends SQLTable {
  constructor(store) {
    super();
    this.id = store.id;
    this.products = new Item(store.products);
    this.props = store.props;
    this.facility_id = store.facility_id;
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "stores",
      pkey: "id",
      fields: ["products","props", "facility_id"]
    };
  }

  static handleHTTP(req, res, next) {
    if (req.path_tokens[0]!='store') {
      return next();
    }

    // user must be admin
    if (!req.user || req.user.roles.indexOf("bowanddrape")==-1)
      return Page.renderNotFound(req, res);

    if (req.method=="GET") {
      if (req.path_tokens.length == 1)
        return Store.handleList(req, res);

      if (req.path_tokens.length == 2)
        return Store.handleGetDetails(req, res);
    }

    if (req.method=="POST" || req.method=="PATCH") {
      if (req.path_tokens[2] == 'products') {
        // FIXME race condition, need to make the select and update atomic!
        return Store.get(req.path_tokens[1], (err, store) => {
          if (err) return res.status(500).json({error:err.toString()});
          if (!store) return res.status(404).json({error:"not found"})
          if (req.method=="POST") {
            // just add a new product
            store.products.push(req.body);
          } else if (req.method=="PATCH") {
            if (req.path_tokens.length==3) {
              // update entire product array
              store.products = req.body;
            } else {
              // update specific product index
              let product = store.products[req.path_tokens[3]];
              for (let i=4; product && i<req.path_tokens.length; i++) {
                product = product.options[req.path_tokens[i]];
              }
              if (product) {
                product = req.body;
              }
            } 
          }
          // save updated store
          store.upsert((err, result) => {
            if (err) return res.status(500).json({error:err.toString()});
            return res.json(store);
          });
        });
      }
    }

    res.json({error: "invalid endpoint"}).end();
  }

  static handleList(req, res) {
    // query for all facilities that we have admin roles on
    let query = "SELECT * FROM stores WHERE props#>'{admins}'?|"+`array['${req.user.roles.join(",")}']`;
    Store.sqlQuery(null, query, [], (err, result) => {
      if (err) return res.status(500).json({error:err.toString()});
      let stores = result.rows.map((store) => {
        store.href = `/store/${store.id}`;
        return store;
      });
      Page.render(req, res, GenericList, {
        title: "Stores",
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

console.log(store);
      ProductList.preprocessProps({store:store}, (err, product_list) => {
        if (err) console.log(err);
        product_list.edit = true;
        Page.render(req, res, ProductList, product_list);
      });
    });
  }
}

module.exports = Store;
