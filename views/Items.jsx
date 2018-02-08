

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
    this.state = {
      expanded: false,
      contents: this.props.contents || [],
      shipping_quote: {
        days: 5,
        amount: 7,
        currency_local: "USD",
      },
      promo: this.props.promo || {code: ""},
    }
  }

  componentWillReceiveProps(next_props) {
    if (next_props.contents) {
      this.setState({contents:next_props.contents});
    }
    if (next_props.promo) {
      this.setState({promo:next_props.promo});
    }
  }

  // TODO maybe put this in ItemUtils.js
  // estimate manufacturing time
  estimateManufactureTime() {
    let days_needed_parallel = 5;
    let days_needed_serial = 0;
    let items = this.state.contents;
    ItemUtils.recurseAssembly(items, (component) => {
      // hardcoded defaults, if not set.
      let default_manufacture_time = {
        parallel: 5,
        serial: 0,
      }
      // FIXME
      // embroidery and airbrush will take longer, too lazy to update the db
      if (/letter_embroidery/.test(component.sku))
        default_manufacture_time.parallel = 10;
      if (/letter_airbrush/.test(component.sku))
        default_manufacture_time.parallel = 10;
      component.props = component.props || {};
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

  render() {
    let line_items = [];
    let summary_items = [];
    let has_promo = false;
    let promo_errors = [];
    let total_num_products = 0;
    let subtotal = 0;
    let total_price = 0;

    let style = Item.style;
    let style_summary = Item.style_summary;

    // get list totals
    for (let i=0; i<this.state.contents.length; i++) {
      if (!this.state.contents[i].props) continue;
      let quantity = this.state.contents[i].quantity || 1;
      if (!isNaN(parseFloat(this.state.contents[i].props.price)))
        total_price += quantity * parseFloat(this.state.contents[i].props.price);
      if (this.state.contents[i].sku) {
        subtotal += quantity * parseFloat(this.state.contents[i].props.price);
        total_num_products += quantity;
      }
    }

    for (let i=0; i<this.state.contents.length; i++) {
      let remove = null;
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
        line_items.push(
          <Item
            style={style}
            key={line_items.length}
            onRemove={remove}
            fulfillment={this.props.fulfillment}
            garment_id={this.props.fulfillment_id?(this.props.fulfillment_id+"-"+(line_items.length+1)):null}
            shipment_id={this.props.shipment_id}
            content_index={i}
            total_num_products={total_num_products}
            edit_tags={this.props.edit_tags}
            {...this.state.contents[i]}
          />
        );
      } else {
        let key = summary_items.length;
        if (this.state.contents[i].props && this.state.contents[i].props.name)
          key = this.state.contents[i].props.name;
        summary_items.push(<Item style={style_summary} key={key} {...this.state.contents[i]} onRemove={remove} is_email={this.props.is_email}/>);
      }
    }

    if (typeof(window)!="undefined" && !line_items.length)
      return null;

    let classname = "";
    if (this.props.packing_slip)
      classname += " packing_slip";
    if (this.props.fulfillment)
      classname += " fulfillment";

    let summary_items_container = (
      <div className={"summary_items"+classname}>
        <div className="summary_items_inner">
          <h3 className="summary_items_header">Summary</h3>
          {/* item subtotal */}
          <div className="item" style={style_summary.item}>
            <div style={style_summary.img_preview_container} />
              {this.props.is_cart ?
                  <div className="item shippingDate" style={style.item}><span className="name" style={{marginRight:"5px"}}>Shipping on or before:</span><Timestamp time={ItemUtils.countBusinessDays(this.estimateManufactureTime())} /></div>
                : null
              }
            <div className="deets" style={style_summary.deets}>
              <span className="name">Cart Subtotal:</span>
              <Price style={style_summary.price_total} price={subtotal}/>
            </div>

          </div>
          {summary_items}

          {/* promo code */}
          <div style={style_summary.img_preview_container}>
            <Errors label="promo" />
          </div>
          {has_promo || !this.props.is_cart ? null :
            <div className="item promo" style={Object.assign({},style_summary.item,{padding:"none"})}>
              <div className="promo_input" style={style_summary.deets}>
                <input placeholder="Promo code" className="clearInput" type="text" value={this.state.promo.code} onChange={(event)=>{this.props.handleUpdatePromoCode(event.target.value)}} onKeyUp={(event)=>{if(event.which==13){this.props.handleApplyPromoCode()}}}/>
                <button onClick={()=>{this.props.handleApplyPromoCode()}}>Apply</button>
              </div>
            </div>
          }

          {/* item price total */}
          <div className="item" style={Object.assign({},style_summary.item,{minHeight: "28px"})}>
            <div style={style_summary.img_preview_container} />
            <div className="deets" style={Object.assign({}, style_summary.deets, {paddingTop: "28px"})}>
              <span className="name">Total:</span>
              <Price style={style_summary.price_total} price={total_price}/>
            </div>
          </div>

        </div>
      </div>
    )

    return [(
        <div className={"items"+classname}>
          {line_items}
        </div>
      ), summary_items_container
    ];
  }
}
module.exports = Items;
