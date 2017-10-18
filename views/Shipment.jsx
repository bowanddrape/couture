
const React = require('react');
const jwt_decode = require('jwt-decode');

const Item = require('./Item.jsx');
const Items = require('./Items.jsx');
const Timestamp = require('./Timestamp.jsx');
const Address = require('./Address.jsx');
const Comments = require('./Comments.jsx');
const Price = require('./Price.jsx');


/***
Draw a shipment. Used in lists of orders/shipments
***/
class Shipment extends React.Component {
  constructor(props) {
    super(props);
    console.log(props);
    this.state = {
      from_id: this.props.from_id,
      to_id: this.props.to_id,
      fulfillment_id: this.props.fulfillment_id,
      packed: this.props.packed,
      approved: this.props.approved,
      on_hold: this.props.on_hold,
      picked: this.props.picked,
      inspected: this.props.inspected,
      received: this.props.received,
      tracking_code: this.props.tracking_code,
      shipping_label: this.props.shipping_label,
      comments: (this.props.props?this.props.props.comments:undefined) || [],
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

  handlePostComment(msg) {
    let user = jwt_decode(BowAndDrape.token);
    let comment = {
      user: user.email,
      time: new Date().getTime()/1000,
      msg,
    };
    let shipment = {
      id: this.props.id,
      props: {
        comments: JSON.parse(JSON.stringify(this.state.comments)),
      }
    };
    shipment.props.comments.push(comment);
    BowAndDrape.api("POST", "/shipment", shipment, (err, ret) =>{
      this.setState({comments: shipment.props.comments});
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
      if (err) return alert(err);
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
      if (err) return alert(err);
      this.setState({
        rates: undefined,
        tracking_code: shipment.tracking_code,
        shipping_label: shipment.shipping_label,
      });
    });
  }

  render() {
    let line_items = [];
    if (this.state.rates) {
      this.state.rates.slice(0).reverse().forEach((rate) => {
        line_items.unshift(
          <div key={line_items.length} style={Item.style.item}>
            <button onClick={this.handleBuyLabel.bind(this, rate.rate_id)} style={{maxWidth:"190px"}}>Buy Label</button>
            <deets>
              <div className="name">{rate.provider}</div>
              <div style={{marginLeft:"10px"}}>{rate.service}</div>
              <div style={{marginLeft:"10px"}}>{rate.duration}</div>
              <Price price={rate.price} style={Item.style.price_total}/>
            </deets>
            <div style={{clear:"both"}}/>
          </div>
        );
      });
    } // this.state.rates

    let product_quantity = 0;
    this.props.contents.forEach((item, index) => {
      if (!item.sku) return;
      let quant = item.quantity || 1;
      product_quantity += quant;
    });

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

    if (!this.state.approved && !this.state.packed && !this.state.on_hold)
      actions.push(<button key={actions.length} onClick={this.handleMarkState.bind(this, "approved")}>Ready to Make</button>);
    if (!this.state.approved && !this.state.packed && !this.state.on_hold)
      actions.push(<button key={actions.length} onClick={this.handleMarkState.bind(this, "on_hold")}>Hold</button>);
    if (this.state.on_hold)
      actions.push(<button key={actions.length} onClick={this.handleRemoveHold.bind(this)}>Remove Hold</button>);

    if (this.state.approved && !this.state.picked && !this.state.packed && !this.state.received)
      actions.push(<button key={actions.length} onClick={this.handleMarkState.bind(this, "picked")}>Picked</button>);
    if (this.state.approved && this.state.picked && !this.state.inspected && !this.state.received)
      actions.push(<button key={actions.length} onClick={this.handleMarkState.bind(this, "inspected")}>QA passed</button>);
    if (this.state.inspected && !this.state.packed && !this.state.received)
      actions.push(<button key={actions.length} onClick={this.handleMarkState.bind(this, "packed")}>Packed</button>);
    // TODO for kiosk mode
    if (false) {
      actions.push(<button key={actions.length} onClick={this.setSink.bind(this, "customer_pickup")}>Marked as Pickedup</button>);
    }

    actions.push(<button key={actions.length} onClick={this.setSink.bind(this, "canceled")}>Cancel</button>);

    let fulfillment_tools = null;
    if (this.props.fulfillment) {
      fulfillment_tools = (
        <div>
          <div className="time_bar">
            <div>requested: <Timestamp time={this.props.requested} /></div>
            <div>approved: <Timestamp time={this.props.approved} /></div>
            <div>packed: <Timestamp time={this.state.packed} /></div>
            <div>received: <Timestamp time={this.state.received} /></div>
          </div>
          <div className="header_menu">
            <shipping_details>
              <div><label>Order_id: </label><a href={`/shipment/${this.props.id}`}>{this.props.props&&this.props.props.legacy_id?this.props.props.legacy_id:this.props.id}</a></div>
              <div><label>Fulfillment_id: </label> {this.props.fulfillment_id} </div>
              <div><label>Deliver_by: </label><Timestamp time={this.props.delivery_promised} /></div>
              {to}
              <div><label>User: </label>{this.props.email}</div>
              {this.state.shipping_label?<div><label>Shipping: </label><a href={this.state.shipping_label} target="_blank">Label</a></div>:null}
              <div><label>PackingSlip: </label><a href={`/shipment/${this.props.id}?packing_slip=1&layout=basic`} target="_blank">link</a></div>
              <div><label>Tracking: </label><a href={`https://tools.usps.com/go/TrackConfirmAction.action?tLabels=${this.state.tracking_code}`} target="_blank">{this.state.tracking_code}</a></div>
              <div style={{pointerEvents:"none"}}><label>Comments: </label></div>
              <Comments comments={this.state.comments} handlePostComment={this.handlePostComment.bind(this)} />
            </shipping_details>
            <div className="action_bar">
              {actions}
            </div>
          </div>
        </div>
      )
    }

    let payment_info = null;
    if (!this.props.fulfillment) {
      payment_info = (
        <div>
          <h1 style={Object.assign({},Item.style.item,{borderBottom:"none",borderTop:"solid 1px #000",margin:"12px auto"})}>PAYMENT INFO</h1>
          <div className="payment_info" style={Object.assign({},Item.style.item,{borderBottom:"none",fontSize:"18px",justifyContent:"space-between"})}>
            <div style={{float:"left"}}>
              Billing Information
              <Address {...this.props.billing_address}/>
            </div>
            <div style={{float:"right"}}>
              Shipping Address
              <Address {...this.props.address}/>
            </div>
            <div style={{clear:"both"}}/>
          </div>
        </div>
      );
    }

    return (
      <shipment>
        {fulfillment_tools}
        <h1 style={Object.assign(
          {},
          Item.style.item,
          {borderBottom:"none",margin:"34px auto",justifyContent:"space-between"})}>
          <div>ORDER SUMMARY</div><div>ITEMS ( {product_quantity} )</div>
        </h1>
        <contents>
          {line_items}
          <Items contents={this.props.contents} fulfillment={this.props.fulfillment} packing_slip={this.props.packing_slip}/>
        </contents>
        {payment_info}
      </shipment>
    )
  }

}

module.exports = Shipment;
