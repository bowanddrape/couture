
const async = require('async');
const React = require('react');

const Inventory = require('../models/Inventory.js');

class ProductList extends React.Component {
  constructor(props) {
    super(props);
  }

  static preprocessProps(options, callback) {
    if (!options.store || !options.store.length) return callback("No store specified");
    let store = options.store[0];
    // get store inventory
    Inventory.get(store.facility_id, function(err, store_inventory) {
      if (err) return callback(err);
      if (!store_inventory || !store_inventory.inventory) return callback("Store has no inventory");
      // set up sync with db components
      let sku_queries = [];
      store.products.recurseProductFamily(function(item, ancestor) {
        sku_queries.push(function(callback) {
          item.get(item.sku, function(err, db_item) {
            item.inheritDefaults(db_item);
            callback(err);
          });
        });
      });

      async.parallel(sku_queries, function(err) {

        // convert compatible_component from sku list to component list
        store.products.hydrateCompatibleComponents(function(err) {

          store.products.recurseProductFamily(function(item, ancestor) {
            // merge inventory count with products in family
            item.quantity = store_inventory.inventory[item.sku]?store_inventory.inventory[item.sku]:0;
            // inherit props through product families
            item.inheritDefaults(ancestor);
            // get inventory for any compatible families
            if (!item.compatible_components) return;
            item.compatible_components.forEach((component) => {
              component.quantity = store_inventory.inventory[component.sku] ? store_inventory.inventory[component.sku] : 0;
              if (!component.options) return;
              component.options.forEach((option) => {
                option.recurseProductFamily(function(item, ancestor) {
                  item.quantity = store_inventory.inventory[item.sku]?store_inventory.inventory[item.sku]:0;
                });
              });
            });
          });
          // cull out un-needed fields from the virtual product family bits
          store.products.recurseProductFamily(function(item, ancestor) {
            if (item.options) {
              delete item.compatible_components;
            }
          });

          callback(null, options);

        }); // hydrate compatible_components
      }); // sync with db components
    }); // get store_inventory
  };

  render() {
    return (
      <div>product list
        {JSON.stringify(this.props)}
      </div>
    );
  }
}
module.exports = ProductList;
