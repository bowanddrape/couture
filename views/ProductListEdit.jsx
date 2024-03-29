
const React = require('react');
const async = require('async');
const Autocomplete = require('react-autocomplete');

/***
admin widget to add a new product to a ProductList
***/
class ProductListEdit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      autocomplete_items: [],
      autocomplete_value: '',
      autocomplete_loading: false,
      selected: null
    };
  }

  render() {
    return (
      <a className="card" style={this.state.selected ? {backgroundImage:`url(${this.state.selected.props.image}`} : {}}>
        <label>
          {this.state.selected && this.state.selected.props
            ? this.state.selected.props.name
            : ""}
        </label>
        <Autocomplete
          value={this.state.autocomplete_value}
          items={this.state.autocomplete_items}
          inputProps={{placeholder:"Product SKU", className:"autocomplete"}}
          getItemValue={(item) => item.props.name}
          onSelect={(value, item) => {
            this.setState({ autocomplete_items: [ item ], autocomplete_value: value, selected:item })
          }}
          onChange={(event, value) => {
            // don't request more data until we've heard back
            if (this.state.autocomplete_loading)
              return;
            this.setState({ autocomplete_value: value, autocomplete_loading: true, selected: null })
            this.handleAutocompleteQuery(value, (err, items) => {
              if (items.length==1)
                this.setState({ autocomplete_items: items, autocomplete_loading: false, selected: items[0] })
              else
                this.setState({ autocomplete_items: items, autocomplete_loading: false })
            });
          }}
          renderItem={(item, isHighlighted) => (
            <div
              className={isHighlighted ? "selected" : "notselected"}
              key={item.sku}
            >{item.props.name}</div>
          )}
        />
        <button onClick={this.handleAdd.bind(this)} className={this.state.autocomplete_value?"":"disabled"}>
          {this.state.selected?"Select":"Create"}
        </button>
      </a>
    );
  }

  handleAdd() {
    if (!this.state.autocomplete_value)
      return;
    let add_tasks = [];
    let product = this.state.selected;
    // if this is a brand new component, create it
    if (this.state.selected===null) {
      product = {
        sku: this.state.autocomplete_value,
        props: {
          name: this.state.autocomplete_value
        }
      };
      add_tasks.push(BowAndDrape.api.bind(this, "POST", "/component", product));
    }
    // update store to have this product
    add_tasks.push(this.updateStoreProducts.bind(this, {sku: this.state.autocomplete_value}, "POST"));

    async.series(add_tasks, (err, data) => {
      if (err) return console.log(err);
      // if we successfully updated, reload so we can see our changes
      location.reload();
    });

  }

  // called by the add component autocomplete searchbox
  handleAutocompleteQuery(query, callback) {
    BowAndDrape.api('GET', `/component?search=${query}&page={"limit":8}`, null, callback);
  }

  updateStoreProducts(product, method, callback) {
    BowAndDrape.api(method, `/store/${this.props.store.id}/products`, product, callback);
  }

}

module.exports = ProductListEdit;
