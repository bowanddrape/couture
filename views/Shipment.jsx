
const React = require('react');

const Item = require('./Item.jsx');
const Timestamp = require('./Timestamp.jsx');

class Shipment extends React.Component {
  render() {

    let line_items = [];
    for (let i=0; i<this.props.contents.items.length; i++) {
      let item_props = this.props.contents.items[i];
      item_props.key = i;
      item_props.picklist = true;
      line_items.push(React.createElement(Item, item_props));
    }

    return (
      <shipment>
        <div className="time_bar">
          sent: <Timestamp time={this.props.sent} />
          received: <Timestamp time={this.props.received} />
        </div>
        <shipping_details>
          <div><label>From: </label>{this.props.from_id}</div>
          <div><label>To: </label>{this.props.to_id}</div>
          <div><label>Order: </label>{this.props.order_id}</div>
          <div><label>Tracking: </label>{this.props.tracking_code}</div>
        </shipping_details>
        <contents>{line_items}</contents>
      </shipment>
    )
  }
}

module.exports = Shipment;
