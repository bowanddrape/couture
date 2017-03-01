
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
    this.facility_id = store.facility_id;
    this.products = new Item(store.products);
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "stores",
      pkey: "id",
      fields: ["facility_id","products"]
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

    if (req.method=="POST") {
      if (req.path_tokens.length == 3) {
        if (req.path_tokens[2] == 'products') {
          // FIXME race condition, need to make the select and update atomic!
          return Store.get(req.path_tokens[1], (err, store) => {
            if (err) return res.status(500).json({error:err.toString()});
            if (!store) return res.status(404).json({error:"not found"})
            store.products.push(req.body);
            store.upsert((err, result) => {
              if (err) return res.status(500).json({error:err.toString()});
              return res.json(store);
            });
          });
        }
      }
    }

    res.json({error: "invalid endpoint"}).end();
  }

  static handleList(req, res) {
    // query for all facilities that we have admin roles on
    let query = "SELECT stores.*, facilities.props FROM stores, facilities WHERE stores.facility_id=facilities.id AND facilities.props#>'{admins}'?|"+`array['${req.user.roles.join(",")}']`;
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
      ProductList.preprocessProps({store:store}, (err, product_list) => {
        if (err) console.log(err);
        product_list.edit = true;
        Page.render(req, res, ProductList, product_list);
      });
    });
  }
}

module.exports = Store;
