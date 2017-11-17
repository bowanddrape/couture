
const React = require('react');

/***
called by PageEdit
***/
class PageEditHeroProduct extends React.Component {
  constructor(props) {
    super(props);
  }

  handleUpdate(key, value) {
    if (!this.props.onChange) return;
    let update = this.props || {};
    update = JSON.parse(JSON.stringify(update));
    update[key] = value;
    this.props.onChange(update);
  }

  handleNewCard() {
    if (!this.props.onChange) return;
    let update = this.props || {};
    update = JSON.parse(JSON.stringify(update));
    update.options = update.options || [];
    update.options.push({});
    this.props.onChange(update);
  }

  handleRemoveCard(index) {
    if (!this.props.onChange) return;
    let update = this.props || {};
    update = JSON.parse(JSON.stringify(update));
    update.options = update.options || [];
    update.options.splice(index, 1);
    this.props.onChange(update);
  }

  handleUpdateOption(index, key, value) {
    if (!this.props.onChange) return;
    let update = this.props || {};
    update = JSON.parse(JSON.stringify(update));
    update.options[index][key] = value.trim();
    this.props.onChange(update);
  }

  render() {
    let options = this.props.options || [];
    let option_cards = [];
    options.forEach((option, index) => {
      option_cards.push(<div key={option_cards.length} className="option">
        <div className="fields">
          <div><label>name</label><input type="text" onChange={(event)=>{this.handleUpdateOption(index, "name", event.target.value)}} value={option.name||""}/></div>
          <div><label>selector image</label><input type="text" onChange={(event)=>{this.handleUpdateOption(index, "selector_image", event.target.value)}} value={option.selector_image||""}/></div>
          <span style={{cursor:"pointer"}} className="remove" onClick={this.handleRemoveCard.bind(this, index)} title="delete">✘</span>
        </div>
      </div>);
    });

    return (
      <div className="edit_hero_product">
        <div><label>image</label><input type="text" onChange={(event)=>{this.handleUpdate("image", event.target.value)}} value={this.props.image} placeholder=""/></div>
        <div><label>base sku</label><input type="text" onChange={(event)=>{this.handleUpdate("base_sku", event.target.value)}} value={this.props.base_sku} placeholder=""/></div>
        <div><label>product name</label><input type="text" onChange={(event)=>{this.handleUpdate("name", event.target.value)}} value={this.props.name}/></div>
        <div><label>product price</label><input type="text" onChange={(event)=>{this.handleUpdate("price", event.target.value)}} value={this.props.price}/></div>
        <div><label>copy</label><textarea onChange={(event)=>{this.handleUpdate("copy", event.target.value)}} value={this.props.copy} /></div>
        <div className="options">
          {option_cards}
          <div className="option" style={{cursor:"pointer"}} onClick={this.handleNewCard.bind(this)}>New Option</div>
        </div>
      </div>
    );
  }
}

module.exports = PageEditHeroProduct;
