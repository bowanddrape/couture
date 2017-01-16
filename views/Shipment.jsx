
const React = require('react');

const Item = require('./Item.jsx');
const Timestamp = require('./Timestamp.jsx');
const Address = require('./Address.jsx');

class Shipment extends React.Component {
  render() {

    let line_items = [];
    for (let i=0; this.props.contents && i<this.props.contents.items.length; i++) {
      let item_props = this.props.contents.items[i];
      item_props.key = i;
      item_props.picklist = true;
      line_items.push(React.createElement(Item, item_props));
    }

    let from = (<div><label>From: </label>{this.props.from_id}</div>);
    let to = this.props.to_id;
    if (this.props.facilities && this.props.facilities.length) {
      this.props.facilities.map((facility) => {
        if (facility.id == this.props.from_id) {
          from = (<div><label>From: </label>{facility.props.name} {React.createElement(Address, facility.address)}</div>);
        }
        if (facility.id == this.props.to_id) {
          to = facility.props.name;
        }
      });
    }

    return (
      <shipment>
        <div className="time_bar">
          sent: <Timestamp time={this.props.sent} />
          received: <Timestamp time={this.props.received} />
        </div>
        <shipping_details>
          {from}
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
