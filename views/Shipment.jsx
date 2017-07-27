
const React = require('react');

const Item = require('./Item.jsx');
const Timestamp = require('./Timestamp.jsx');
const Address = require('./Address.jsx');

/***
Draw a shipment. Used in lists of orders/shipments
This is still WiP
***/
class Shipment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      from_id: this.props.from_id,
      to_id: this.props.to_id,
      packed: this.props.packed,
      approved: this.props.approved,
      on_hold: this.props.on_hold,
      in_production: this.props.in_production,
      received: this.props.received,
      tracking_code: this.props.tracking_code,
      shipping_label: this.props.shipping_label,
    }
    this.handleQueryRates = this.handleQueryRates.bind(this);
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
    let shipment = {id: this.props.id};
    Object.assign(shipment, this.state);
    shipment.to_id = id;
    shipment.received = Math.round(new Date().getTime()/1000);
    BowAndDrape.api("POST", "/shipment", shipment, (err, ret) =>{
      this.setState(shipment);
    });
  }

  // FIXME altering state on client-side without tracking updates makes races
  handleMarkState(state) {
    let shipment = {id: this.props.id};
    Object.assign(shipment, this.state);
    shipment[state] = Math.round(new Date().getTime()/1000);
    BowAndDrape.api("POST", "/shipment", shipment, (err, ret) =>{
      this.setState(shipment);
    });
  }

  handleRemoveHold() {
    let shipment = {id: this.props.id};
    shipment.on_hold = "";
    BowAndDrape.api("POST", "/shipment", shipment, (err, ret) =>{
      this.setState(shipment);
    });
  }

  handleQueryRates() {
    let shipment = {id: this.props.id};
    BowAndDrape.api("POST", "/shipment/quote", shipment, (err, ret) =>{
      if (err) return alert(err.error);
      let rates = [];
      ret.forEach((rate) => {
        rates.push({
          rate_id: rate.object_id,
          duration: rate.duration_terms || (rate.days?rate.days+" days":""),
          provider: rate.provider,
          service: rate.servicelevel.name,
          price: rate.amount,
        });
      });
      this.setState({
        rates: rates,
        tracking_code: "quoting...",
      });
    });
  }

  handleBuyLabel(rate_id) {
    let shipment = {id: this.props.id,rate_id: rate_id};
    BowAndDrape.api("POST", "/shipment/buylabel", shipment, (err, shipment) =>{
      if (err) return alert(err.error);
      this.setState({
        rates: undefined,
        tracking_code: shipment.tracking_code,
        shipping_label: shipment.shipping_label,
      });
    });
  }

  render() {
    let line_items = [];
    if (this.props.contents) {
      let item_array = typeof(this.props.contents.items)!='undefined'?this.props.contents.items:this.props.contents;
      let picklist = !this.state.packed && !this.state.received;
      for (let i=0; i<item_array.length; i++) {
        line_items.push(<Item key={line_items.length} picklist={picklist} {...item_array[i]} />);
      }
    } // populate line_items
    if (this.state.rates) {
      this.state.rates.slice(0).reverse().forEach((rate) => {
        line_items.unshift(
          <item key={line_items.length} style={{minHeight:"65px"}}>
            <button onClick={this.handleBuyLabel.bind(this, rate.rate_id)} style={{maxWidth:"190px"}}>Buy Label</button>
            <deets>
              <div className="name">{rate.provider}</div>
              <div style={{marginLeft:"10px"}}>{rate.service}</div>
              <div style={{marginLeft:"10px"}}>{rate.duration}</div>
              <div className="price">{rate.price}$</div>
            </deets>
            <div style={{clear:"both"}}/>
          </item>
        );
      });
    } // this.state.rates

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

    if (!this.state.tracking_code)
      actions.push(<button key={actions.length} onClick={this.handleQueryRates}>Ship</button>);

    if (this.state.tracking_code && this.state.tracking_code!="quoting..." && !this.state.approved && !this.state.on_hold)
      actions.push(<button key={actions.length} onClick={this.handleMarkState.bind(this, "approved")}>Ready to Make</button>);
    if (!this.state.approved && !this.state.on_hold)
      actions.push(<button key={actions.length} onClick={this.handleMarkState.bind(this, "on_hold")}>Hold</button>);
    if (this.state.on_hold)
      actions.push(<button key={actions.length} onClick={this.handleRemoveHold.bind(this)}>Remove Hold</button>);

    if (this.state.approved && !this.state.in_production && !this.state.packed && !this.state.received)
      actions.push(<button key={actions.length} onClick={this.handleMarkState.bind(this, "in_production")}>Send to Production</button>);
    if (this.state.in_production && !this.state.packed && !this.state.received)
      actions.push(<button key={actions.length} onClick={this.handleMarkState.bind(this, "packed")}>Mark as Packed</button>);
    // TODO for kiosk mode
    if (false) {
      actions.push(<button key={actions.length} onClick={this.setSink.bind(this, "customer_pickup")}>Marked as Pickedup</button>);
    }

    actions.push(<button key={actions.length} onClick={this.setSink.bind(this, "canceled")}>Cancel</button>);

    return (
      <shipment>
        <div className="time_bar">
          <div>requested: <Timestamp time={this.props.requested} /></div>
          <div>approved: <Timestamp time={this.props.approved} /></div>
          <div>packed: <Timestamp time={this.state.packed} /></div>
          <div>received: <Timestamp time={this.state.received} /></div>
        </div>
        <div className="header_menu">
          <shipping_details>
            <div><label>Order_id: </label>{this.props.props&&this.props.props.legacy_id?this.props.props.legacy_id:this.props.id}</div>
            <div><label>Deliver_by: </label><Timestamp time={this.state.delivery_promised} /></div>
            {to}
            <div><label>User: </label>{this.props.email}</div>
            {this.props.address?<div><label>Address: </label><Address {...this.props.address}/></div>:null}
            {this.state.shipping_label?<div><label>Shipping: </label><a href={this.state.shipping_label} target="_blank">Label</a></div>:null}
            <div><label>Tracking: </label><a href={`https://tools.usps.com/go/TrackConfirmAction.action?tLabels=${this.state.tracking_code}`} target="_blank">{this.state.tracking_code}</a></div>
          </shipping_details>
          <div className="action_bar">
            {actions}
          </div>
        </div>
        <contents>{line_items}</contents>
      </shipment>
    )
  }

}

module.exports = Shipment;
