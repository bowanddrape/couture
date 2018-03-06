
const React = require('react');
const jwt_decode = require('jwt-decode');
const Autocomplete = require('react-autocomplete');

const Errors = require('./Errors.jsx');

/***
A raw display helper used by some admin models.
No react handlers or bindings allowed here aside from render() and
componentWillMount() as this rendered server side only
***/
class ManageInventory extends React.Component {
  constructor(props) {
    super(props);
    // make inventory entries an object instead of just a count
    let inventory = {};
    for (let sku in this.props.inventory)
      inventory[sku] = {quantity:this.props.inventory[sku]};
    this.state = {
      inventory,
      autocomplete_items: [],
    }
    this.component_map = {};
    this.props.components.forEach((component) => {
      this.component_map[component.sku] = component;
    });
  }

  handleToggleAdjust(sku) {
    this.setState((prev_state) => {
      prev_state.inventory[sku] = prev_state.inventory[sku]||{};
      prev_state.inventory[sku].adjusting = !prev_state.inventory[sku].adjusting;
      return (prev_state);
    });
  }

  handleManualAdjustment(sku) {
    let quantity = parseInt(document.querySelector(`#sku_${sku}_quantity`).value);
    if (isNaN(quantity)) return;

    let user = jwt_decode(BowAndDrape.token);
    let diff = quantity - this.state.inventory[sku].quantity;
    let shipment = {
      from_id: '5c637540-d460-4938-ac38-b6d283ea9a6d',
      to_id: this.props.facility.id,
      requested: Math.floor(new Date().getTime()/1000),
      received: Math.floor(new Date().getTime()/1000),
      email: user.email,
      contents: [{
        sku: sku,
        quantity: diff,
      }]
    }
    BowAndDrape.api("POST", "/shipment", shipment, (err, response) => {
      if (err) return Error.emitError(null, err);
      this.setState((prev_state) => {
        prev_state.inventory[sku].quantity = quantity;
        prev_state.inventory[sku].adjusting = false;
        return (prev_state);
      });
    });
  }

  handleAutocompleteManualAdjustment() {
    if (!this.state.autocomplete_value) return;
    let quantity = parseInt(document.querySelector("#autocomplete_quantity").value);
    if (isNaN(quantity)) return;
    let user = jwt_decode(BowAndDrape.token);
    let shipment = {
      from_id: '5c637540-d460-4938-ac38-b6d283ea9a6d',
      to_id: this.props.facility.id,
      requested: Math.floor(new Date().getTime()/1000),
      received: Math.floor(new Date().getTime()/1000),
      email: user.email,
      contents: [{
        sku: this.state.autocomplete_value,
        quantity,
      }]
    }
    BowAndDrape.api("POST", "/shipment", shipment, (err, response) => {
      if (err) return Error.emitError(null, err);
      location.reload();
    });
  }

  render() {
    let inventory_lines = [];
    // sort applique skus to bottom
    Object.keys(this.state.inventory).sort((a, b) => {
      if (/(letter_)|(emoji_)|(premade_)/.test(a) && !/(letter_)|(emoji_)|(premade_)/.test(b))
        return 1;
      if (!/(letter_)|(emoji_)|(premade_)/.test(a) && /(letter_)|(emoji_)|(premade_)/.test(b))
        return -1;
      return a.localeCompare(b);
    }).forEach((sku) => {
      // ignore embroidery letters
      if (/letter_embroidery/.test(sku)) return;
      let inventory = this.state.inventory[sku];
      let count = (<div className="count">
        <span className="number">{inventory.quantity}</span>
        <button onClick={this.handleToggleAdjust.bind(this, sku)}>adjust</button>
      </div>);
      if (inventory.adjusting) {
        count = (<div className="count">
          <input id={`sku_${sku}_quantity`} type="text" placeholder={inventory.quantity}/><button onClick={this.handleManualAdjustment.bind(this, sku)}>save</button>
        </div>);
      }

      let factory_sku="";
      let preview_img="";
      let product_info="";
      if (this.component_map[sku]) {
        if (this.component_map[sku].props.factory_sku)
          factory_sku = `(${this.component_map[sku].props.factory_sku})`;
        if (this.component_map[sku].props.image)
          preview_img = <img src={this.component_map[sku].props.image}/>;
        product_info = <span>{this.component_map[sku].props.name} <b>{parseFloat(this.component_map[sku].props.price).toFixed(2)}</b></span>;
      }

      inventory_lines.push(
        <div key={sku} className="inventory_line">
          <div>
            <b>{sku}</b>:
            {factory_sku}
            {preview_img}
            {product_info}
          </div>
          {count}
        </div>
      );
    });

    return (
      <div className="inventory" style={{padding:"20px"}}>
        <h2>Inventory for {this.props.facility.props.name}</h2>

        <div>
          <Autocomplete
            inputProps={{placeholder:"Product SKU"}}
            value={this.state.autocomplete_value}
            items={this.state.autocomplete_items}
            getItemValue={(component) => component.sku}
            onSelect={(value, item) => {
              this.setState({ autocomplete_items: [ item ], autocomplete_value: value, selected:item })
            }}
            onChange={(event, value) => {
              let autocomplete_items = this.props.components.filter((component) => {
                return new RegExp(value, "i").test(component.sku);
              });
              this.setState({autocomplete_value: value, autocomplete_items})
            }}
            renderItem={(item, isHighlighted) => (
              <div
                className={isHighlighted ? "selected" : "notselected"}
                key={item.sku}
              >{item.sku}</div>
            )}
          />
          <input id="autocomplete_quantity" type="text" placeholder="quantity" />
          <button onClick={this.handleAutocompleteManualAdjustment.bind(this)}>add inventory</button>
        </div>
        {inventory_lines}
      </div>
    );
  }
}
module.exports = ManageInventory;
