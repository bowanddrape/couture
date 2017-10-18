
const zeros = require('zeros');
const sharp = require('sharp');
const savePixels = require("save-pixels");

const SQLTable = require('./SQLTable');
const Item = require('./Item.js');
const Page = require('./Page.js');
const GenericList = require('../views/GenericList.jsx');
const ProductList = require('../views/ProductList.jsx')
const Customizer = require('../views/Customizer.js')

/***
Handles store model and all /store/ endpoints
***/
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

    // server side customization rendering
    if (req.path_tokens.length == 3 && req.path_tokens[2]=="preview")
      return Store.drawCustomization(req, res);

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

      ProductList.preprocessProps({store:store}, (err, product_list) => {
        if (err) res.status(500).end(err.toString());
        product_list.edit = true;
        Page.render(req, res, ProductList, product_list);
      });
    });
  }

  static drawCustomization(req, res) {
    Store.get(req.path_tokens[1], (err, store) => {
      if (err) return res.status(500).end(err.toString());
      if (!store) return Page.renderNotFound(req, res);

      // cache EVERYTHING: if the browser had something, use it!
      if (req.headers['if-modified-since'])
        return res.status(304).end();

      ProductList.preprocessProps({store:store}, (err, product_list) => {
        product_list.c = req.query['c'];
        product_list = new ProductList(product_list);
        product_list.componentWillMount();
        if (!product_list.initial_product) return Page.renderNotFound(req, res);

        let width = parseInt(req.query['w']) || 200;
        let height = parseInt(req.query['h']) || 200;
        let camera_index = parseInt(req.query['camera']) || 0;
        let resolution = 2;
        let customizer = new Customizer({width:width*resolution, height:height*resolution});
        customizer.init();
        // set our camera, 404 if invalid
        if (camera_index && !product_list.initial_product.props.cameras)
          return Page.renderNotFound(req, res);
        if (product_list.initial_product.props.cameras) {
          if (!product_list.initial_product.props.cameras[camera_index])
            return Page.renderNotFound(req, res);
          customizer.updatePMatrix(product_list.initial_product.props.cameras[camera_index]);
        }

        customizer.set(product_list.initial_product, {assembly:product_list.initial_assembly}, () => {

          let pixel_buffer = new Uint8Array(width * height * resolution * resolution * 4);
          let gl = customizer.gl;
          gl.clearColor(1, 1, 1, 0);
          customizer.render();
          gl.readPixels(0, 0, width*resolution, height*resolution, gl.RGBA, gl.UNSIGNED_BYTE, pixel_buffer);
          // these 2 lines shouldn't be needed but it's having some type problems
          let pixels = zeros([height*resolution, width*resolution, 4]);
          pixels.data = pixel_buffer;

          res.setHeader("Cache-Control", "public, max-age=0");
          res.setHeader("Expires", new Date(Date.now() + 2592000000).toUTCString());
          res.setHeader("Last-Modified", new Date(0).toUTCString());
          savePixels(pixels, "png").pipe(sharp().rotate(270).resize(width, height)).pipe(res).on("finish", () => {
            // tell headless-gl to garbage collect
            gl.getExtension('STACKGL_destroy_context').destroy();
          });
        }); // customizer.set()
      }); // ProductList.preprocessProps()
    }); // Store.get()
  }
}

// keep around some common constant special ids so we don't have to do a db
// lookup each time
// TODO cache things and look things up from cache instead
Store.special_ids = {
  vss : 'd955f9f3-e9ae-475a-a944-237862b589b3',
};

module.exports = Store;
