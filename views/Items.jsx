

const React = require('react');
const Item = require('./Item.jsx');
const Timestamp = require('./Timestamp.jsx');
const ItemUtils = require('./ItemUtils.js');
const Errors = require('./Errors.jsx');
const Price = require('./Price.jsx');

/***
Draw a list of Item.
props:
  is_cart:? // draw as a cart? (vs draw in an order shipment)
***/
class Items extends React.Component {
  constructor(props) {
    super(props);
    this.state = {      expanded: false,
      contents: this.props.contents || [],
      shipping_quote: {
        days: 5,
        amount: 7,
        currency_local: "USD",
      },
      promo: {
        code: "",
      },
      account_credit: 0,
    }
  }

  // TODO maybe put this in ItemUtils.js
  updateShipping(callback) {
    if (!this.props.is_cart) return;
    this.setState((prevState) => {
      let contents = JSON.parse(JSON.stringify(prevState.contents));
      // TODO maybe get a new shipping quote. Hardcoded for now
      let shipping_quote = prevState.shipping_quote;
      // remove any previous shipping line
      contents.forEach((item, index) => {
        if (/^Shipping /.test(item.props.name))
          return contents.splice(index, 1);
      });
      // doesn't cost anything to ship nothing
      if (!contents.length) {
        return ({contents: contents});
      }
      let total_price = ItemUtils.getPrice(contents, (item)=>{
        // don't include account credits in this price
        if (new RegExp("^Account balance", "i").test(item.props.name))
          return false;
        return true;
      });
      let shipping_cost = shipping_quote.amount;
      // free domestic shipping for 75+ orders
      if (total_price>=75 && shipping_quote.currency_local.toLowerCase()=="usd")
        shipping_cost = 0;
      if (this.state.promo.props && this.state.promo.props.free_ship)
        shipping_cost = 0;
      contents.push({
        props: {
          name: "Shipping & Handling:",
          price: shipping_cost
        }
      });
      return ({contents: contents});
    }, callback); // this.setState()
  }

  updateCredit(credit) {
    this.setState({account_credit:credit}, () => {
      this.updateContents(this.state.contents);
    });
  };


  updateContents(contents) {
    contents = contents || [];
    this.setState({contents}, () => {
      // update shipping line
      this.updateShipping(() => {
        // update account credit line
        this.setState((prevState) => {
          let contents = JSON.parse(JSON.stringify(prevState.contents));
          ItemUtils.applyCredits(prevState.account_credit, contents);
          return ({contents});
        }, () => {
          // as a final callback, call onUpdate from parent?
          if (this.props.onUpdate)
            this.props.onUpdate(this);
        });
      });
    });
  }

  // estimate manufacturing time
  estimateManufactureTime() {
    let days_needed_parallel = 5;
    let days_needed_serial = 0;
    let items = this.state.contents;
    ItemUtils.recurseAssembly(items, (component) => {
      // hardcoded defaults, if not set.
      let default_manufacture_time = {
        parallel: 7,
        serial: 0,
      }
      // FIXME
      // embroidery and airbrush will take longer, too lazy to update the db
      if (/letter_embroidery/.test(component.sku))
        default_manufacture_time.parallel = 10;
      if (/letter_airbrush/.test(component.sku))
        default_manufacture_time.parallel = 15;
      // extract the manufacture_time for this component
      let manufacture_time = component.props.manufacture_time || {};
      manufacture_time.parallel = manufacture_time.parallel || default_manufacture_time.parallel;
      manufacture_time.serial = manufacture_time.serial || default_manufacture_time.serial;
      // update our accumulator
      days_needed_parallel = Math.max(days_needed_parallel, manufacture_time.parallel);
      days_needed_serial += manufacture_time.serial;
    });
    return days_needed_parallel + days_needed_serial;
  }

  // estimate date from now, takes days, returns time in seconds
  countBusinessDays(days) {
    let floorDate = function(time_stamp) {
      time_stamp -= time_stamp % (24 * 60 * 60 * 1000); // subtract amount of time since midnight
      time_stamp += new Date().getTimezoneOffset() * 60 * 1000; // add on the timezone offset
      return time_stamp;
    }
    // start counting from midnight tonight
    let ms_per_day = (24 * 60 * 60 * 1000);
    let time = floorDate(new Date().getTime()) + ms_per_day;
    for (let i=0; i<days; ) {
      time += ms_per_day;
      if (new Date(time).getDay()%6!=0)
        i += 1;
    }
    return time/1000;
  }

  handleApplyDiscountCode() {
    if (!BowAndDrape) return;
    BowAndDrape.api("GET", "/promocode", {code:this.state.promo.code.toLowerCase()}, (err, result) => {
      if (err) return Errors.emitError("promo", err.toString());
      if (!result.length) return Errors.emitError("promo", "no such promo code");
      let promo = result[0];
      this.setState({promo: promo});
      // FIXME this is a race as contents could be modified between
      // clone and set, but I can't figure out how to wrap this properly
      let contents = JSON.parse(JSON.stringify(this.state.contents));
      ItemUtils.applyPromoCode(contents, promo, (err, items) => {
        if (err) return Errors.emitError("promo", err.toString());
        this.updateContents(items);
      });
    });
  }

  render() {
    let line_items = [];
    let summary_items = [];
    let has_promo = false;
    let subtotal = 0;
    let total = 0;

    let style = Item.style;
    let style_summary = Item.style_summary;
    // hide irrelevant things on packing slip
    if (this.props.packing_slip) {
      style_summary.item = Object.assign({}, style_summary.item, {display:"none"});
    }

    for (let i=0; i<this.state.contents.length; i++) {
      let remove = null;
      let quantity = this.state.contents[i].quantity || 1;
      total += quantity * this.state.contents[i].props.price;
      if (this.state.contents[i].sku)
        subtotal += quantity * this.state.contents[i].props.price;
      // attach quantity edit buttons
      if (this.props.is_cart && typeof(BowAndDrape)!="undefined" && BowAndDrape.cart_menu) {
        // remove button
        if (this.state.contents[i].sku)
          remove = BowAndDrape.cart_menu.remove.bind(BowAndDrape.cart_menu, i);
        if (this.state.contents[i].props && new RegExp("^promo:", "i").test(this.state.contents[i].props.name)) {
          has_promo = true;
          remove = BowAndDrape.cart_menu.remove.bind(BowAndDrape.cart_menu, i);
        }
      }
      // if has a base sku or is a legacy imported item
      if (this.state.contents[i].sku || this.state.contents[i].prerender_key) {
        line_items.push(<Item style={style} key={line_items.length} {...this.state.contents[i]} onRemove={remove} fulfillment={this.props.fulfillment} garment_id={this.props.fulfillment_id?(this.props.fulfillment_id+"-"+(line_items.length+1)):null} shipment_id={this.props.shipment_id} content_index={this.props.content_index}/>);
      } else {
        summary_items.push(<Item style={style_summary} key={summary_items.length} {...this.state.contents[i]} onRemove={remove} is_email={this.props.is_email}/>);
      }
    }

    if (typeof(window)!="undefined" && !line_items.length)
      return null;

    let classname = "items";
    if (this.props.packing_slip)
      classname += " packing_slip";
    if (this.props.fulfillment)
      classname += " fulfillment";

    return (
      <div className={classname}>
        <div className="product_wrapper">
          {line_items}
        </div>
        <div className="summary_items">
          <div className="summary_items_inner">
            <h3 className="summary_items_header">Summary</h3>
            {/* item subtotal */}
            <div className="item" style={style_summary.item}>
              <div style={style_summary.img_preview_container} />
                {this.props.is_cart ?
                    <div className="item shippingDate" style={style.item}><span className="sum-bold" style={{marginRight:"5px"}}>Shipping on or before:</span><Timestamp time={this.countBusinessDays(this.estimateManufactureTime())} /></div>
                  : null
                }
              <div className="deets" style={style_summary.deets}>
                <span className="sum-bold">Cart Subtotal:</span>
                <Price  style={style_summary.price_total} price={subtotal}/>
              </div>

            </div>
            {summary_items}

            {/* item price total */}
            <div className="item" style={Object.assign({},style_summary.item,{minHeight: "28px"})}>
              <div style={style_summary.img_preview_container} />
              <div className="deets" style={Object.assign({}, style_summary.deets, {paddingTop: "28px"})}>
                <span className="sum-bold">Total:</span>
                <Price  style={style_summary.price_total} price={total}/>
              </div>
            </div>

            {has_promo || !this.props.is_cart ? null :
              <div className="item promo" style={Object.assign({},style_summary.item,{padding:"none"})}>
                <div style={style_summary.img_preview_container}><Errors label="promo" /></div>
                <div className="promo_input" style={style_summary.deets}>
                  <input placeholder="Promo code" className="clearInput" type="text" value={this.state.promo.code} onChange={(event)=>{this.setState({promo:{code:event.target.value}})}} onKeyUp={(event)=>{if(event.which==13){this.handleApplyDiscountCode()}}}/>
                  <button onClick={()=>{this.handleApplyDiscountCode()}}>Apply</button>
                </div>
              </div>
            }
          </div> {/* .summary_items_inner */}
        </div> {/* .summary_items_outer */}

        </div>
    );
  }
}
module.exports = Items;
