
const async = require('async');
const React = require('react');

const ProductCanvas = require('./ProductCanvas.jsx');
const ProductListEdit = require('./ProductListEdit.jsx');
const Tabs = require('./Tabs.jsx');

class ProductList extends React.Component {
  constructor(props) {
    super(props);

    let product_map = {};
    this.props.store.products.forEach((product) => {
      product_map[product.sku] = product;
    });

    this.state = {
      selected_product: [null],
      assembly: [],
      product_map: product_map,
    };
  }

  static preprocessProps(options, callback) {
    const Inventory = require('../models/Inventory.js');
    if (!options.store) return callback("No store specified");
    // if we got an array of stores, use the first one
    if (options.store.length)
      options.store = options.store[0];
    let store = options.store;
console.log(store);
    // deep clone initial specification (needed for admin)
    store.products_raw = JSON.parse(JSON.stringify(store.products));
    // get store inventory
console.log("getting inventory for "+store.facility_id);
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

          callback(null, options);

        }); // hydrate compatible_components
      }); // sync with db components
    }); // get store_inventory
  };

  render() {

    let {product, product_options} = this.populateProductOptions();

    // if no valid product selected, show list
    if (!product)
      return this.renderProductList();

    let components = this.populateComponents(product);

    return (
      <customize>
        <button style={{position:"fixed",top:"0px",right:"0px"}}>Add To Cart</button>
        <div className="canvas_container">
          <product_options>
            {product_options}
          </product_options>
          <ProductCanvas assembly={this.state.assembly} {...product} />
        </div>
        <Tabs className="components">
          {components}
        </Tabs>
      </customize>
    );
  }

  handleOptionChange(value, depth) {
    let selected_product = this.state.selected_product;
    selected_product[depth] = value;
    let product = this.state.product_map[this.state.selected_product[0]];
    if (!product)
      return this.setState({selected_product: [null]});

    // see which of the currently selected options are applicable
    for (let i=1; i<selected_product.length; i++) {
      if (!product.options) {
        selected_product.length = i;
        break;
      }
      // fill in any null depths with default option
      if (!selected_product[i]) {
        selected_product[i] = Object.keys(product.options)[0];
      }
      product = product.options[selected_product[i]];
      if (!product) {
        selected_product.length = i;
        break;
      }
    }
    this.setState({selected_product});
  }

  // takes react synthetic key event
  handleNewProductOption(event) {
    if(event.key!="Enter") return;

    let products = this.props.store.products_raw;
    let product = null;
    for (let i=0; i<products.length; i++) {
      if (products[i].sku == this.state.selected_product[0]) {
        product = products[i];
        break;
      }
    };
    for (let i=1; i<this.state.selected_product.length; i++) {
      product = product.options[this.state.selected_product[i]];
    }
    product.options[event.target.value] = {};

    BowAndDrape.api("PATCH", `/store/${this.props.store.id}/products`, products, (err, result) => {
      if (err) return console.log(err);
      // if we successfully updated, reload so we can see our changes
      location.reload();
    });
  }


  renderProductList() {
    let products = [];
    this.props.store.products.forEach((product) => {
      products.push(<a className="card" onClick={(event)=>{this.handleOptionChange(product.sku, 0)}} key={products.length} style={{backgroundImage:`url(${product.props.image})`}}><label>{product.props.name}</label></a>);
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

  populateProductOptions() {
    let product_options = [];
    // initialize selected_product
    let product = this.state.product_map[this.state.selected_product[0]];
    for (let i=1; i<this.state.selected_product.length; i++) {
      product = product.options[this.state.selected_product[i]];
    }

    // first have the top level product selector
    let options = [];
    this.props.store.products.forEach((product) => {
      options.push(<option key={options.length} value={product.sku}>{product.props.name}</option>);
    });
    if (options.length) {
      product_options.push(
        <select onChange={(event)=>{this.handleOptionChange(event.target.value, 0)}} value={this.state.selected_product[0]} key={product_options.length}>{options}</select>
      )
    }
    
    // recurse to fill out option menus
    let traverse_options = (option_product, depth=1) => {
      // if at a leaf, we're done
      if (!option_product.options) return;

      let options = [];
      let available_options = Object.keys(option_product.options);
      if (this.props.edit) {
        available_options.unshift("no option selected");
      }
      // if no option is otherwise selected, default to the first option
      let selected_option = this.state.selected_product[depth];
      if (!selected_option && available_options.length)
        selected_option = available_options[0];
      // populate options
      for (let i=0; i<available_options.length; i++) {
        options.push(<option key={options.length}>{available_options[i]}</option>);
      };
      if (options.length) {
        product_options.push(
          <select onChange={(event)=>{this.handleOptionChange(event.target.value, depth)}} key={product_options.length} value={selected_option}>{options}</select>
        )
      }
      if (selected_option=="no option selected") {
        // allow adding new option
        product_options.push(
          <input type="text" key={product_options.length} placeholder="New Option" onKeyDown={this.handleNewProductOption.bind(this)} />
        );
      }
      // recurse in next option depth
      if (selected_option && option_product.options[selected_option]) {
        traverse_options(option_product.options[selected_option], depth+1);
      }
    }
    if (product)
      traverse_options(this.state.product_map[this.state.selected_product[0]]);

    return {product, product_options};
  }

  populateComponents(product) {
    // populate components
    let components = [];
    let misc_components = [];
    for (let i=0; i<product.compatible_components.length && i<100; i++) {
      if (product.compatible_components[i].options) {
        let tab_components = [];
        for (let j=0; j<product.compatible_components[i].options.length; j++) {
          tab_components.push(
            <div key={i+'_'+j}  style={{backgroundImage:`url(${product.compatible_components[i].options[j].props.image})`}}/>
          );
        }
        components.push(
          <div name={product.compatible_components[i].props.name} className="component_container">
            {tab_components}
          </div>
        );
        continue;
      }
      misc_components.push(
        <div key={i+'_0'}  style={{backgroundImage:`url(${product.compatible_components[i].props.image})`}}/>
      );
    }

    if (misc_components.length) {
      components.push(
        <div name="misc sparkles" className="component_container">
          {misc_components}
        </div>
      );
    }
    return components;
  }

}

module.exports = ProductList;
