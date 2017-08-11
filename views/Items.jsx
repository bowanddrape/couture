

const React = require('react');
const Item = require('./Item.jsx');
const Timestamp = require('./Timestamp.jsx');
const ItemUtils = require('./ItemUtils.js');
const Errors = require('./Errors.jsx');

/***
Draw a list of Item.
props:
  is_cart:? // draw as a cart? (vs draw in an order shipment)
***/
class Items extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contents: this.props.contents || [],
      shipping_quote: {
        days: 5,
        amount: 7,
        currency_local: "USD",
      },
      promo_code: "",
      account_credit: 0,
    }
  }

  static recurseAssembly(components, foreach) {
    components.forEach((component) => {
      Item.recurseAssembly(component, foreach);
    });
  }

  updateShipping(callback) {

    if (!this.props.is_cart) return;
    this.setState((prevState) => {
      let contents = JSON.parse(JSON.stringify(prevState.contents));
      // TODO maybe get a new shipping quote. Hardcoded for now
      let shipping_quote = prevState.shipping_quote;
      // remove any previous shipping line
      contents.forEach((item, index) => {
        if (item.props.name == "Shipping & Handling")
          return contents.splice(index, 1);
      });
      // doesn't cost anything to ship nothing
      if (!contents.length) {
        return ({contents: contents});
      }
      // don't include account credits in this price
      let total_price = ItemUtils.getPrice(contents, (item)=>{
        if (new RegExp("^Account balance", "i").test(item.props.name))
          return false;
        return true;
      });
      let shipping_cost = shipping_quote.amount;
      // free domestic shipping for 75+ orders
      if (total_price>=75 && shipping_quote.currency_local.toLowerCase()=="usd")
        shipping_cost = 0;
      contents.push({
        props: {
          name: "Shipping & Handling",
          price: shipping_cost
        }
      });
      return ({contents: contents});
    }, callback); // this.setState()
  }

  componentDidMount() {
    if ("undefined" === typeof this.props.ignoreWebCart) {
      if (this.props.is_cart) {
        if (BowAndDrape.cart_menu) {
          this.updateContents(BowAndDrape.cart_menu.state.contents);
        }
        BowAndDrape.dispatcher.on("update_cart", this.updateContents.bind(this));
      }
    }
  }

  updateCredit(credit) {
    this.setState({account_credit:credit}, () => {
      this.updateContents(this.state.contents);
    });
  };

  updateContents(contents) {
    contents = contents || [];
    this.updateShipping();
    this.setState({contents}, () => {
      // update shipping line
      this.updateShipping(() => {
        // update account credit line
        this.setState((prevState) => {
          let contents = JSON.parse(JSON.stringify(prevState.contents));
          ItemUtils.applyCredits(prevState.account_credit, contents);
          return ({contents});
        });
      });
    });
  }

  // estimate manufacturing time
  estimateManufactureTime() {
    let days_needed = 1;
    let items = this.state.contents;
    ItemUtils.recurseAssembly(items, (component) => {
      // hardcoded defaults, if not set.
      let default_manufacture_time = {
        parallel: 3,
        serial: 0,
      }
      // embroidery and airbrush will take longer, too lazy to update the db
      if (/letter_embroidery/.test(component.sku) || /letter_airbrush/.test(component.sku))
        default_manufacture_time.parallel = 7;
      // extract the manufacture_time for this component
      let manufacture_time = component.props.manufacture_time || {};
      manufacture_time.parallel = manufacture_time.parallel || default_manufacture_time.parallel;
      manufacture_time.serial = manufacture_time.serial || default_manufacture_time.serial;
      // update our accumulator
      days_needed = Math.max(days_needed, manufacture_time.parallel);
      days_needed += manufacture_time.serial;
    });
    return days_needed;
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
    return time / 1000;
  }

  handleApplyDiscountCode() {
    BowAndDrape.api("GET", "/promocode", {code:this.state.promo_code}, (err, result) => {
      if (err) return Errors.emitError("promo", err.toString());
      if (!result.length) return Errors.emitError("promo", "no such promo code");
      let promo = result[0];
      console.log(err, promo);
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

    let items = [];
    let has_promo = false;

    for (let i=0; i<this.state.contents.length; i++) {
      let remove = null;
      try {
        if (this.state.contents[i].sku)
          remove = BowAndDrape.cart_menu.remove.bind(BowAndDrape.cart_menu, items.length);
        if (this.state.contents[i].props && new RegExp("^promo:", "i").test(this.state.contents[i].props.name)) {
          has_promo = true;
          remove = BowAndDrape.cart_menu.remove.bind(BowAndDrape.cart_menu, items.length);
        }
      }  // try

      catch(err) {
        console.log("CATCH: " + err);
      }
      items.push(<Item key={items.length} {...this.state.contents[i]} onRemove={remove}/>);
    }



    if (typeof(window)!="undefined" && !items.length)
      return null;

    return (
      <cart>
        {this.props.is_cart ?
          <item><span style={{marginRight:"5px"}}>Shipping on or before:</span><Timestamp time={this.countBusinessDays(this.estimateManufactureTime())} /></item>
          : null
        }
        {items}
        {has_promo ? null :
          <item>
            <Errors label="promo" />
            Promo Code:<input type="text" style={{height:"20px"}} value={this.state.promo_code} onChange={(event)=>{this.setState({promo_code:event.target.value})}}/>
            <button onClick={()=>{this.handleApplyDiscountCode()}}>Apply</button>
          </item>
        }
      </cart>
    );
  }  //  render
}  //  class Items
module.exports = Items;
