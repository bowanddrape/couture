
const React = require('react');

const Item = require('./Item.jsx');
const Timestamp = require('./Timestamp.jsx');
const Address = require('./Address.jsx');

class Shipment extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.props;
    this.handlePack = this.handlePack.bind(this);
    this.handlePickup = this.handlePickup.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  updateShipment(shipment, callback) {
    if (!BowAndDrape.token) return;
    var self = this;
    let xhr = new XMLHttpRequest();
    xhr.open("POST", '/shipment', true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", "Bearer "+BowAndDrape.token);
    xhr.onreadystatechange = function() {
      if (this.readyState!=4) {
        return;
      }
      let response = JSON.parse(this.responseText);
      if (callback) return callback(response);
      if (response.error) {
        return console.log(response.error);
      }
      self.setState(response);
    }
    xhr.send(JSON.stringify(shipment));
  }

  setSink(sink) {
    if (typeof(BowAndDrape)=="undefined") return;
    // get id for sink
    let id = null;
    for (let index in BowAndDrape.facilities) {
      if (BowAndDrape.facilities[index].props.name == sink) {
        id = index;
        break;
      }
    }
    if (!id)
      return console.log("No shipment sink: "+sink);
    let shipment = {};
    Object.assign(shipment, this.state);
    shipment.to_id = id;
    shipment.received = Math.round(new Date().getTime()/1000);
    this.updateShipment(shipment);
  }

  // FIXME altering state on client-side without tracking updates makes races
  handlePack() {
    let shipment = {};
    Object.assign(shipment, this.state);
    shipment.packed = Math.round(new Date().getTime()/1000);
    this.updateShipment(shipment);
  }

  handlePickup() {
    this.setSink("customer_pickup");
  }

  handleCancel() {
    this.setSink("canceled");
  }

  render() {
    let line_items = [];
    if (this.state.contents) {
      let item_array = typeof(this.state.contents.items)!='undefined'?this.state.contents.items:this.state.contents;
      for (let i=0; i<item_array.length; i++) {
        line_items.push(<Item key={line_items.length} picklist={true} {...item_array[i]} />);
      }
    } // populate line_items

    let from = (<div><label>From: </label>{this.state.from_id}</div>);
    let to = (<div><label>To: </label>{this.state.to_id}</div>);
    if (typeof(BowAndDrape)!="undefined" && BowAndDrape.facilities) {
      if (BowAndDrape.facilities[this.state.from_id]) {
        let facility = BowAndDrape.facilities[this.state.from_id];
        from = (<div><label>From: </label>{facility.props.name} {React.createElement(Address, facility.address)}</div>);
      }
      if (BowAndDrape.facilities[this.state.to_id]) {
        let facility = BowAndDrape.facilities[this.state.to_id];
        to = (<div><label>To: </label>{facility.props.name} {React.createElement(Address, facility.address)}</div>);
      }
    } // lookup facilities

    let actions = [];
    if (!this.state.received) {
      if (!this.state.packed) {
        actions.push(<button key={actions.length} onClick={this.handlePack}>Mark as Packed</button>);
      }
      if (this.state.packed) {
        actions.push(<button key={actions.length} onClick={this.handlePickup}>Marked as Pickedup</button>);
      }
      actions.push(<button key={actions.length} onClick={this.handleCancel}>Mark as Canceled</button>);
    }

    return (
      <shipment>
        <div className="time_bar">
          requested: <Timestamp time={this.state.requested} />
          packed: <Timestamp time={this.state.packed} />
          received: <Timestamp time={this.state.received} />
        </div>
        <div className="action_bar">
          {actions}
        </div>
        <shipping_details>
          {from}
          {to}
          <div><label>Order: </label>{this.state.order_id}</div>
          <div><label>Tracking: </label>{this.state.tracking_code}</div>
        </shipping_details>
        <div style={{clear:'both'}}/>
        <contents>{line_items}</contents>
      </shipment>
    )
  }
}

module.exports = Shipment;
