
const async = require('async');
const JSONAPI = require('./JSONAPI');

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
class Component extends JSONAPI {
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
    if (!this.assembly) return;
    this.assembly.forEach((component) => {
      component.recurseProductFamily(foreach, this);
    });
  }
}
module.exports = Component;
