
const async = require('async');
const React = require('react');
const querystring = require('querystring');

const ProductCanvas = require('./ProductCanvas.jsx');
const ProductListEdit = require('./ProductListEdit.jsx');
const ComponentEdit = require('./ComponentEdit.jsx');
const Tabs = require('./Tabs.jsx');
const ComponentSerializer = require('./ComponentSerializer.js');

class ProductList extends React.Component {
  constructor(props) {
    super(props);

    let product_map = {};
    this.props.store.products.forEach((product) => {
      product_map[product.sku] = product;
    });

    this.state = {
      selected_product: [null],
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
    store.products.populateFromDB((err) => {
      // deep clone initial specification (needed for admin)
      store.products_raw = JSON.parse(JSON.stringify(store.products));
      // convert compatible_component from sku list to component list
      store.products.hydrateCompatibleComponents(function(err) {
        // get store inventory
        Inventory.get(store.facility_id, function(err, store_inventory) {
          if (err) return callback(err);
          if (!store_inventory || !store_inventory.inventory) store_inventory={inventory:{}};
          store.products.recurseProductFamily(function(item, ancestor) {
            // merge inventory count with products in family
            item.quantity = store_inventory.inventory[item.sku] || 0;
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
          }); // inherit unset fields through product families

          callback(null, options);

        }); // get store_inventory
      }); // hydrate compatible_components
    }); // populate with db components
  };

  componentWillMount() {
    let customization = ComponentSerializer.parse(this.props.c);
    if (customization) {
      this.setState({selected_product: customization.selected_product});

      let product = this.state.product_map[customization.selected_product[0]];
      for (let i=1; product && i<customization.selected_product.length; i++) {
        product = product.options[customization.selected_product[i]];
      }
      // fill in our customization
      let initial_assembly = customization.assembly;
      let components = {};
      // slow, but touch all of everything?
      let traverse_item_options = (item_collection, foreach) => {
        if (!item_collection) return;
        if (typeof(item_collection)=='array') {
          return item_array.forEach((component) => {
            foreach(component);
            traverse_item_options(component.options, foreach);
            traverse_item_options(component.assembly, foreach);
          });
        }
        if (typeof(item_collection)=='object') {
          return Object.keys(item_collection).forEach((key) => {
            let component = item_collection[key];
            foreach(component);
            traverse_item_options(component.options, foreach);
            traverse_item_options(component.assembly, foreach);
          });
        }
      };
      // memory intensive, but make a map of all components?
      traverse_item_options(product.compatible_components, (component) => {
        if (component && component.sku)
          components[component.sku] = component;
      });
      // fill in things we just have the sku for
      traverse_item_options(initial_assembly, (component) => {
        if (component && component.sku) {
          component.props = JSON.parse(JSON.stringify(components[component.sku].props));
        }
      });
      this.initial_product = product;
      this.initial_assembly = initial_assembly;
    } // this.props.c
  }

  render() {
    let {product, product_options} = this.populateProductOptions();

    // if no valid product selected, show list
    if (!product)
      return this.renderProductList();

    let components = this.populateComponents(product);
    let product_raw = this.getSelectedProductRaw();

    return (
      <customize>
        {this.props.edit ?
          <ComponentEdit {...product_raw} inherits={product} /> :
          <button onClick={this.handleAddToCart.bind(this, product)} style={{position:"fixed",top:"0px",right:"0px",zIndex:"1",maxWidth:"none",margin:"0px"}}>Add To Cart</button>
        }
        <div className="canvas_container">
          <product_options>
            {product_options}
          </product_options>
          <ProductCanvas ref="ProductCanvas" product={product} handleUpdateProduct={this.handleUpdateProduct.bind(this)} assembly={this.initial_assembly}/>
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

  // get the non-inherited version of the selected product (used for saving)
  getSelectedProductRaw() {
    let products = this.props.store.products_raw;
    let product_raw = null;
    for (let i=0; i<products.length; i++) {
      if (products[i].sku == this.state.selected_product[0]) {
        product_raw = products[i];
        break;
      }
    };
    for (let i=1; i<this.state.selected_product.length; i++) {
      product_raw = product_raw.options[this.state.selected_product[i]];
    }
    return product_raw;
  }

  // takes react synthetic key event
  handleNewProductOption(event) {
    if(event.key!="Enter") return;

    let product_raw = this.getSelectedProductRaw();
    product_raw.options = product_raw.options || {};
    product_raw.options[event.target.value] = {sku:`${product_raw.sku}_${event.target.value.toLowerCase().replace(/\s/g,"")}`};

    BowAndDrape.api("POST", `/component`, product_raw, (err, result) => {
      if (err) return console.log(err);
      // if we successfully updated, reload so we can see our changes
      location.reload();
    });
  }

  handleAddToCart(product, event) {
    let item = {
      sku: product.sku,
      quantity: 1,
      assembly: this.refs.ProductCanvas.state.assembly,
      props: product.props
    };
    BowAndDrape.cart.add(item);
    location.href = "/cart";
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
    for (let i=1; product && i<this.state.selected_product.length; i++) {
      product = product.options[this.state.selected_product[i]];
    }

    // first have the top level product selector
    let options = [];
    this.props.store.products.forEach((product) => {
      options.push(<option key={options.length} value={product.sku}>{product.props.name}</option>);
    });
    if (options.length) {
      product_options.push(
        <select onChange={(event)=>{this.handleOptionChange(event.target.value, 0)}} value={this.state.selected_product[0]} key={Math.random()}>{options}</select>
      )
    }
    
    // recurse to fill out option menus
    let traverse_options = (option_product, depth=1) => {
      // if we're not editing, select whatever product we end up on
      if (!this.props.edit)
        product = option_product;
      // if at a leaf, we're done
      if (!option_product.options) {
        if (this.props.edit) {
          // allow adding new option
          product_options.push(
            <input type="text" key={Math.random()} placeholder="New Option" onKeyDown={this.handleNewProductOption.bind(this)} />
          );
        }
        return;
      }

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
          <select onChange={(event)=>{this.handleOptionChange(event.target.value, depth)}} key={Math.random()} value={selected_option}>{options}</select>
        )
      }
      if (selected_option=="no option selected") {
        // allow adding new option
        product_options.push(
          <input type="text" key={Math.random()} placeholder="New Option" onKeyDown={this.handleNewProductOption.bind(this)} />
        );
      }
      // recurse in next option depth
      if (selected_option && option_product.options[selected_option]) {
        traverse_options(option_product.options[selected_option], depth+1);
      }
    } // define traverse_options()

    if (product)
      traverse_options(this.state.product_map[this.state.selected_product[0]]);

    return {product, product_options};
  } // populateProductOptions

  handleAddComponent(component) {
    this.refs.ProductCanvas.handleAddComponent(component);
  }
  handlePopComponent() {
    this.refs.ProductCanvas.handlePopComponent();
  }
  handleSelectComponent(component) {
    this.refs.ProductCanvas.handleSelectComponent(component);
  }
  handleUpdateProduct() {
    // call this whenever there was an update to base_product or assembly
    // TODO only do the following when done with a component drag!
    let item = {
      selected_product: this.state.selected_product,
      assembly: this.refs.ProductCanvas.state.assembly,
    };
    ComponentSerializer.stringify(item, (err, serialized) => {
      let toks = location.href.split('?');
      let url = toks[0];
      let query_params = {}
      if (toks.length>1) {
        query_params = querystring.parse(toks.slice(1).join('?'));
      }
      query_params.c = serialized;
      url += '?' + querystring.stringify(query_params);
      history.replaceState(history.state, "", url);
    });
  }

  populateComponents(product) {
    // populate components
    let components = [];
    let misc_components = [];
    for (let i=0; product.compatible_components && i<product.compatible_components.length; i++) {
      if (product.compatible_components[i].options) {
        // handle if keyboard
        if (product.compatible_components[i].props.is_letters) {
          // array => map
          let component_letters = {};
          let tab_components = [];
          for (let j=0; j<product.compatible_components[i].options.length; j++) {
            let letter = product.compatible_components[i].options[j];
            let toks = letter.props.name.split('_');
            let character = toks[toks.length-1].toLowerCase();
            if (character.match(/^[a-z]$/))
              component_letters[character] = letter;
            else {
              component_letters[character] = letter;
              tab_components.push(
                <div key={i+'_'+j} style={{backgroundImage:`url(${letter.props.image})`,backgroundSize:`${letter.props.imagewidth/letter.props.imageheight*100}% 100%`}} onClick={this.handleAddComponent.bind(this, letter)}/>
              );
            }
          }
          components.push(
            <div key={components.length} name={product.compatible_components[i].props.name} className="component_keyboard_container">
              <row>{['q','w','e','r','t','y','u','i','o','p'].map((character)=>{
                return (<div key={character} style={{backgroundImage:`url(${component_letters[character].props.image})`,backgroundSize:`${component_letters[character].props.imagewidth/component_letters[character].props.imageheight*100}% 100%`}} onClick={this.handleAddComponent.bind(this, component_letters[character])}/>);
              })}</row>
              <row>
                <div key="spacer0" className="halfgap"/>
                {['a','s','d','f','g','h','j','k','l'].map((character)=>{
                  return (<div key={character} style={{backgroundImage:`url(${component_letters[character].props.image})`,backgroundSize:`${component_letters[character].props.imagewidth/component_letters[character].props.imageheight*100}% 100%`}} onClick={this.handleAddComponent.bind(this, component_letters[character])}/>);
                })}
                <div key="spacer1" className="halfgap"/>
              </row>
              <row>
                <div key="spacer2" className="halfgap"/>
                <div key="spacer2a" className="halfgap"/>
                {['z','x','c','v','b','n','m'].map((character)=>{
                  return (<div key={character} style={{backgroundImage:`url(${component_letters[character].props.image})`,backgroundSize:`${component_letters[character].props.imagewidth/component_letters[character].props.imageheight*100}% 100%`}} onClick={this.handleAddComponent.bind(this, component_letters[character])}/>);
                })}
                <div key="spacer3" className="halfgap"/>
                <div key="backspace" className="backspace" onClick={this.handlePopComponent.bind(this)}/>
              </row>
              <row>
                <div key="spacer3a" className="halfgap"/>
                <div key="spacer3b" className="halfgap"/>
                <div key="spacebar" className="spacebar" onClick={this.handleAddComponent.bind(this, component_letters["space"])}/>
                <div key="spacer3c" className="halfgap"/>
                <div key="enter" className="enter" onClick={this.handleSelectComponent.bind(this, -1)}/>
              </row>
            </div>
          );
          components.push(
            <div key={components.length} name={product.compatible_components[i].props.name+"_cont"} className="component_container">{tab_components}</div>
          );
          continue;
        }
        // otherwise just list them
        let tab_components = [];
        for (let j=0; j<product.compatible_components[i].options.length; j++) {
          tab_components.push(
            <div key={i+'_'+j} style={{backgroundImage:`url(${product.compatible_components[i].options[j].props.image})`}} onClick={this.handleAddComponent.bind(this, product.compatible_components[i].options[j])}/>
          );
        }
        components.push(
          <div key={components.length} name={product.compatible_components[i].props.name} className="component_container">
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
        <div key={components.length} name="misc sparkles" className="component_container">
          {misc_components}
        </div>
      );
    }
    return components;
  } // populateComponents()

}

module.exports = ProductList;
