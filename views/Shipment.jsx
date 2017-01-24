
const React = require('react');

const Item = require('./Item.jsx');
const Timestamp = require('./Timestamp.jsx');
const Address = require('./Address.jsx');

class Shipment extends React.Component {
  render() {
    let line_items = [];
    if (this.props.contents) {
      let item_array = typeof(this.props.contents.items)!='undefined'?this.props.contents.items:this.props.contents;
      for (let i=0; i<item_array.length; i++) {
        line_items.push(<Item key={line_items.length} picklist={true} {...item_array[i]} />);
      }
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
          requested: <Timestamp time={this.props.requested} />
          packed: <Timestamp time={this.props.packed} />
          received: <Timestamp time={this.props.received} />
        </div>
        <div className="action_bar">
          <button>Mark as Packed</button>
          <button>Mark as Canceled</button>
        </div>
        <shipping_details>
          {from}
          <div><label>To: </label>{this.props.to_id}</div>
          <div><label>Order: </label>{this.props.order_id}</div>
          <div><label>Tracking: </label>{this.props.tracking_code}</div>
        </shipping_details>
        <div style={{clear:'both'}}/>
        <contents>{line_items}</contents>
      </shipment>
    )
  }
}

module.exports = Shipment;
