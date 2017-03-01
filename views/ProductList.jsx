
const async = require('async');
const React = require('react');

const ProductCanvas = require('./ProductCanvas.jsx');
const ProductListEdit = require('./ProductListEdit.jsx');

class ProductList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected_product: [null],
      assembly: [],
    };
  }

  static preprocessProps(options, callback) {
    const Inventory = require('../models/Inventory.js');
    if (!options.store) return callback("No store specified");
    // if we got an array of stores, use the first one
    if (options.store.length)
      options.store = options.store[0];
    let store = options.store;
    // deep clone initial specification (needed for admin)
    store.products_raw = JSON.parse(JSON.stringify(store.products));
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

  selectProduct(selected_product) {
    this.setState({selected_product: selected_product});
  }

  render() {
    let product_map = {};
    this.props.store.products.forEach((product) => {
      product_map[product.sku] = product;
    });

    // find out which product is selected
    let selected_product = product_map[this.state.selected_product[0]];

    // if no valid product selected, show list
    if (!selected_product) {
      let products = [];
      this.props.store.products.forEach((product) => {
        products.push(<a className="card" onClick={this.selectProduct.bind(this, [product.sku])} key={products.length} style={{backgroundImage:`url(${product.props.image})`}}><label>{product.props.name}</label></a>);
      });
      if (this.props.edit) {
        products.push(<ProductListEdit key={products.length} store={this.props.store}/>);
      }
      return (
        <div>
          <product_list className="deck">
            {products}
          </product_list>
        </div>
      );
    }

    // figure out product options
    let product_options = [];
    // fill out option menus
    let traverse_options = (product, depth=1) => {
      let options = [];
console.log(product);
      // if no option is otherwise selected, default to the first option
      let selected_option = this.state.selected_product[depth];
      if (!selected_option && product.options)
        selected_option = Object.keys(product.options)[0];
      for (let option in product.options) {
        options.push(<option key={options.length}>{option}</option>);
      };
      if (options.length) {
        product_options.push(
          <select key={product_options.length} value={selected_option}>{options}</select>
        )
      }
      selected_product = product;
      if (selected_option && product.options[selected_option]) {
        traverse_options(product.options[selected_option], depth+1);
      }
    }
    traverse_options(product_map[this.state.selected_product[0]]);

    // populate components
    let components = [];
    for (let i=0; i<selected_product.compatible_components.length && i<20; i++) {
      if (selected_product.compatible_components[i].options) {
        for (let j=0; j<selected_product.compatible_components[i].options.length; j++) {
          components.push(
            <div key={i+'_'+j}  style={{backgroundImage:`url(${selected_product.compatible_components[i].options[j].props.image})`}}/>
          );
        }
        continue;
      }
      components.push(
        <div key={i+'_0'}  style={{backgroundImage:`url(${selected_product.compatible_components[i].props.image})`}}/>
      );
    }

    return (
      <customize>
        <div className="canvas_container">
          <product_options>
            {product_options}
          </product_options>
          <ProductCanvas assembly={this.state.assembly} {...selected_product} />
        </div>
        <div className="component_container">
          {components}
        </div>
      </customize>
    );

  }
}

module.exports = ProductList;
