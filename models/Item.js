
const async = require('async');
const Component = require('./Component');

/***
This class handles arrays of Components (where Components in turn may have
assemblies or be families of products. More description in the Components model
// TODO rename this class and file to 'Components' because that's the way
plurals work. I may use the term "item" or "component" interchangably =(
***/
class Item extends Array {
  constructor(items) {
    super();
    this.length = 0;

    if (!items) items = [];
    if (items.sku) {
      this.push(new Component(items));
    } else if (items.length) {
      items.forEach((item) => {
        this.push(new Component(item));
      });
    }
  }

  // call corresponding function on all items
  recurseProductFamily(foreach, ancestor=null) {
    return this.forEach((item) => {
      item.recurseProductFamily(foreach, null);
    });
  }
  recurseAssembly(foreach, ancestor=null) {
    return this.forEach((item) => {
      item.recurseAssembly(foreach, null);
    });
  }
  populateFromDB(callback) {
    let populate_tasks = this.map((component) => {
      return component.populateFromDB.bind(component);
    });
    async.parallel(populate_tasks, callback);
  }

  hydrateCompatibleComponents(callback) {
    let skus = [];
    let sku_query = [];
    let option_query = [];
    let components = {};
    // fill sku list
    this.forEach((item) => {
      if (!item.compatible_components) return;
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
          component.populateFromDB(() => {
            components[sku] = component;
            callback(err);
          });
        });
      });
    });
    async.parallel(sku_query, (err) => {
      // if these components in turn have options, fetch those too
      for (let sku in components) {
        if (!components[sku] || !components[sku].options) continue;
        components[sku].options.forEach((option) => {
          option.recurseProductFamily(function(item, ancestor) {
            option_query.push(function(callback) {
              item.get(item.sku, function(err, db_item) {
                item.inheritDefaults(db_item);
                callback(err);
              });
            });
          });
          option.inheritDefaults(components[sku]);
        });
      };

      async.parallel(option_query, (err) => {
        // replace sku string array with array of components
        this.forEach((item) => {
          let hydrated_components = [];
          if (!item.compatible_components)
            item.compatible_components = [];
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

};

module.exports = Item;
