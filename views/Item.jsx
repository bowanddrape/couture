
const React = require('react');

class Item extends React.Component {
  render() {
    let picklist = null;

    return (
      <item>
        <deets>
          <img src={this.props.props.image}/>
          <div>{this.props.sku}</div>
          <div>{this.props.props.name}</div>
          <div>${this.props.props.price}</div>
          <div></div>
        </deets>
        {picklist}
        {JSON.stringify(this.props.assembly)}
      </item>
    )
  }
}

module.exports = Item;
