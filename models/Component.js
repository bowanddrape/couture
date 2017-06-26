
const async = require('async');
const JSONAPI = require('./JSONAPI');
const Page = require('./Page');

const ComponentsEdit = require('../views/ComponentsEdit.jsx');

const inherited_props = ['name', 'image', 'price', 'imagewidth', 'imageheight', 'design_area', 'weight'];

/***
This is a bit weird and super ad-hoc...
Component can either refer to a line-item in a BoM, invoice, or a product or a product family. Here are some examples (TODO these should be unit tests instead)
  let bom_component = {sku:"whatever", props{what:"ever"}, quantity: 1};
  let order_or_invoice_lineitem = {sku:"tax", props{name:"kinda like death"}, assembly:[{sku:"component_sku",position:{}}], price: 20.12};
  let product = {sku:"whatever", props{what:"ever"}, compatible_components:[{sku:"bom_component_sku"}]};
  let product_family = {props:{image:"/url.png"},options:{
    bright: {props:{name:"bright style",image:"/url.png"},options:{
      small: {sku:"family_bright_small",props:{}},
      biggie: {sku:"family_bright_biggie",props:{}},
    }},
    shade: {props:{name:"shade style",image:"/url.png"},options:{
      small: {sku:"family_shade_small",props:{}},
      biggie: {sku:"family_shade_biggie",props:{}},
    }}
  }};
***/
class Component extends JSONAPI {
  constructor(object) {
    super();

    // set sku, props, assembiles, compatible_components, price, etc.
    Object.assign(this, object);

    // if not present, props is empty
    if (!this.props) this.props = {};
    if (typeof(this.props)=="string") {
      try {
        this.props = JSON.parse(this.props);
      } catch(err) {
        console.log(err);
      }
    }
    // options apply to product families only, virtual groups of components
    // convert these into Components
    if (this.options) {
      for (let option in this.options) {
        this.options[option] = new Component(this.options[option]);
      }
    }
    // assemblies are how to build a product, also convert these to Components
    if (typeof(this.assembly)!='array') {
      this.assembly = [];
    }
    this.assembly = this.assembly.map((assembly) => {
      return new Component(assembly);
    });
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "components",
      pkey: "sku",
      fields: ["props", "assembly", "options", "compatible_components"]
    };
  }

  get(sku, callback) {
    Component.get(sku, callback);
  }

  // fill in from an ancestor if not set on our current component
  inheritDefaults(component) {
    if (!component) return;
    inherited_props.forEach((prop_name) => {
      this.props[prop_name] = this.props[prop_name] ?
                              this.props[prop_name] :
                              component.props[prop_name];
    });
    if (component.compatible_components) {
      this.compatible_components = this.compatible_components || [];
      this.compatible_components = this.compatible_components.length ?
                                   this.compatible_components :
                                   component.compatible_components;
    }
  }

  populateFromDB(callback) {
    // TODO flag to shortcut lookup if we know we have everything
    let option_tasks = [];

    this.recurseProductFamily(function(item, ancestor) {
      option_tasks.push(function(callback) {
        item.get(item.sku, function(err, db_item) {
          if (!db_item) return callback(err);

          item.inheritDefaults(db_item);
          // also grab product options
          if (db_item.options) {
            item.options = item.options || db_item.options;
          }
          // populate grabbed item if need be
          let option_tasks = [];
          item.options = item.options || {};
          Object.keys(item.options).forEach((option) => {
            option_tasks.push(item.options[option].populateFromDB.bind(item.options[option]));
          });
          async.parallel(option_tasks, callback);
        });
      });
    });
    async.parallel(option_tasks, callback);
  }

  // run a function for each option in family
  recurseProductFamily(foreach, ancestor=null) {
    foreach(this, ancestor);
    for (let option in this.options) {
      this.options[option].recurseProductFamily(foreach, this);
    }
  }

  // run a function for each component in assembly
  recurseAssembly(foreach, ancestor=null) {
    foreach(this, ancestor);
    if (!this.assembly) return;
    this.assembly.forEach((component) => {
      component.recurseProductFamily(foreach, this);
    });
  }

  // extends JSONAPI
  handleHTTPPage(req, res, next) {
    // user must be an admin
    if (!req.user || req.user.roles.indexOf("bowanddrape")==-1)
      return Page.renderNotFound(req, res);
    Page.render(req, res, ComponentsEdit, {});
  }

  // extends JSONAPI
  onApiSave(req, res, object, callback) {
    // if an image was uploaded, set the image to the resulting img path
    if (req.files && req.files.length && req.files[0].location)
      object.props.image = req.files[0].location;

    object.upsert((err, result) => {
      if (callback)
        return (callback(err, result));
      if (err)
        return res.json({error: err});
      return res.json(object);
    });
  }

} module.exports = Component;
