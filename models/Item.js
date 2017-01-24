
const async = require('async');
const SQLTable = require('./SQLTable');

const inherited_props = ['name', 'image', 'price'];

/*
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
*/
class Component extends SQLTable {
  constructor(object) {
    super();

    // set sku, props, assembiles, compatible_components, price, etc.
    Object.assign(this, object);

    // if not present, props is empty
    if (!this.props) this.props = {};
    // options apply to product families only, virtual groups of components
    // convert these into Components
    if (this.options) {
      for (let option in this.options) {
        this.options[option] = new Component(this.options[option]);
      }
    }
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

  // if not set on our current component
  inheritDefaults(component) {
    if (!component) return;

    inherited_props.forEach((prop_name) => {
      this.props[prop_name] = this.props[prop_name] ?
                              this.props[prop_name] :
                              component.props[prop_name];
    });
    if (component.compatible_components) {
      this.compatible_components = this.compatible_components ?
                                   this.compatible_components :
                                   component.compatible_components;
    }
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
    this.assembly.forEach((component) => {
      component.recurseProductFamily(foreach, this);
    });
  }
}

// This class handles arrays of items, where items may have assemblies or
// be families of products, it's intentionally open but could get messy
// quickly but I suppose we'll deal with that problem later
// TODO It's getting messy already, we need some more error handling and tests
class Item {
  constructor(items) {
    // if this is a single item, put it in an array
    this.items = items.sku ? [items.sku] : items;
    // if we got nothing, flaunt it
    if (!this.items) {
      this.items = [];
    }
    this.items = this.items.map(function(item) {
      return new Component(item);
    });
  }

  toJSON() {
// FIXME this means the object and class structure don't line up
    return this.items;
  }

  // call corresponding function on all items
  recurseProductFamily(foreach, ancestor=null) {
    return this.items.forEach((item) => {
      item.recurseProductFamily(foreach, null);
    });
  }
  recurseAssembly(foreach, ancestor=null) {
    return this.items.forEach((item) => {
      item.recurseAssembly(foreach, null);
    });
  }

  hydrateCompatibleComponents(callback) {
    let skus = [];
    let sku_query = [];
    let option_query = [];
    let components = {};
    // fill sku list
    this.items.forEach((item) => {
      item.compatible_components.forEach((sku) => {
        if (typeof(sku)!="string") return;
        skus.push(sku);
      });
    });
    // filter dupes
    skus = skus.filter(function(elem, index, self) {
      return index == self.indexOf(elem);
    });
    // fetch from database
    skus.forEach((sku) =>{
      sku_query.push(function(callback) {
        Component.get(sku, function(err, component) {
          components[sku] = component;
          callback(err);
        });
      });
    });
    async.parallel(sku_query, (err) => {
      // if these components in turn have options, fetch those too
      for (let sku in components) {
        if (!components[sku].options) continue;
        components[sku].options.forEach((option) => {
          option.recurseProductFamily(function(item, ancestor) {
            option_query.push(function(callback) {
              item.get(item.sku, function(err, db_item) {
                item.inheritDefaults(db_item);
                callback(err);
              });
            });
          });
        });
      };

      async.parallel(option_query, (err) => {
        // replace sku string array with array of components
        this.items.forEach((item) => {
          let hydrated_components = [];
          item.compatible_components.forEach((sku) => {
            if (typeof(sku)!="string") return;
            if (components[sku]) hydrated_components.push(components[sku]);
          });
          item.compatible_components = hydrated_components;
        });
        callback(err);
      }); // hydrate component's options
    }); // hydrate component skus
  } // hydrateCompatibleComponents()

  // FIXME delete this, deprecated
  hydrateAssembly(callback) {
    let skus = [];
    let sku_query = [];
    let components = {};
    // fill sku list
    this.recurseAssembly((component) => {
      skus.push(component.sku);
    });
    // filter dupes
    skus = skus.filter(function(elem, index, self) {
      return index == self.indexOf(elem);
    });
    // fetch from database
    skus.forEach((sku) =>{
      sku_query.push(function(callback) {
        Component.get(sku, function(err, component) {
          components[sku] = component;
          callback(err);
        });
      });
    });
    async.parallel(sku_query, (err) => {
      this.recurseAssembly((component) => {
        component.inheritDefaults(components[component.sku]);
      });
      callback();
    });
  } // hydrateAssembly()
};

module.exports = Item;
