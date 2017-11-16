
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

  render() {
    return (
      <div>
        <div><label>sku</label><input type="text" onChange={(event)=>{this.handleUpdate("sku", event.target.value)}} value={this.props.sku} placeholder=""/></div>
      </div>
    );
  }
}

module.exports = PageEditHeroProduct;
