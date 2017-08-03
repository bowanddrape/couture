
const React = require('react');
const InputAddress = require('./InputAddress.jsx');
const Items = require('./Items.jsx');
const ThanksPurchaseComplete = require('./ThanksPurchaseComplete.jsx');
const Timestamp = require('./Timestamp.jsx');
const UserLogin = require('./UserLogin.jsx');

//const payment_method_client = require('./PayStripeClient.js');
const payment_method_client = require('./PayBraintreeClient.js');

/***
Draws the cart page.

This should probably always be bound to the path '/cart'. Payment methods
currently determed by hardcoding payment_method_client here and hardcoding
payment_method in preprocessProps() and in models/Order.js (3 places FIXME)

The contents of the cart are managed in views/CartMenu.jsx This is just the cart
page and the shipping/payment on it.
***/
class Cart extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      errors: [],
      items: this.props.items || [],
      card: {
        number: "",
        cvc: "",
        exp_month: "",
        exp_year: "",
        address_zip: null,
        errors: "",
      },
      shipping: {
        email: "",
        name: "",
        street: "",
        apt: "",
        locality: "",
        region: "",
        postal: "",
        country: "",
        errors: [],
      },
      same_billing: true,
      billing: {
        name: "",
        street: "",
        apt: "",
        locality: "",
        region: "",
        postal: "",
        country: "",
        errors: [],
      },
      processing_payment: false,
      done: false,
    };

    if (!this.props.store[0].id) {
      this.state.errors.push(<div>Config Error: Store not set</div>);
    }
  } // constructor()

  static preprocessProps(options, callback) {
    // TODO select payment method
    //const payment_method = require('../models/PayStripe.js');
    const payment_method = require('../models/PayBraintree.js');

    // get braintree client token
    if (payment_method.getClientAuthorization) {
      return payment_method.getClientAuthorization((err, payment_authorization) => {
        if (err) {
          console.log(err)
        }
        options.payment_authorization = payment_authorization;
        callback(err, options);
      });
    }

    callback(null, options);
  } // preprocessProps()

  // estimate manufacturing time
  estimateManufactureTime(items) {
    let days_needed = 1;
    Items.recurseAssembly(items, (component) => {
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
    return time/1000;
  }

  // fill in shipping cost
  initShipping(items) {
    let shipping_quote = this.state.shipping_quote;
    // for now, fixed shipping
    shipping_quote = {
      days: 5,
      amount: 7,
      currency_local: "USD",
    }
    // remove any previous shipping line
    items.forEach((item, index) => {
      if (item.props.name == "Shipping & Handling")
        return items.splice(index, 1);
    });
    if (items.length) {
      let total_price = 0;
      items.forEach((item, index) => {
        total_price += parseFloat(item.props.price);
      });
      let shipping_cost = shipping_quote.amount;
      // free domestic shipping for 75+ orders
      if (total_price>=75 && shipping_quote.currency_local.toLowerCase()=="usd")
        shipping_cost = 0;
      items.push({
        props: {
          name: "Shipping & Handling",
          price: shipping_cost
        }
      });
    }
  }

  componentDidMount() {
    if (BowAndDrape.cart_menu) {
      this.updateContents(BowAndDrape.cart_menu.state.contents);
    }
    BowAndDrape.dispatcher.on("update_cart", this.updateContents.bind(this));
  }

  updateContents(items) {
    items = items || [];
    this.initShipping(items);
    this.refs.Items.updateContents(items);
    this.setState({items});
  }

  handleSameBillingToggle(e) {
    this.setState({same_billing:!this.state.same_billing});
  }

  handleFieldChange(section, event) {
    let update = {};
    if (section) {
      update[section] = this.state[section];
      update[section][event.target.getAttribute("name")] = event.target.value;
    }
    this.setState(update);
  }

  // this.state has a lot of objects that in-turn have fields, use this callback
  handleSetSectionState(section, state) {
    let update = {};
    if (section) {
      update[section] = Object.assign(this.state[section], state);
      // special handling for shipping to display warning about customs
      // TODO put this somewhere else (maybe in render()?)
      if (section=="shipping") {
        if (state.country) {
          update[section].errors = [];
          if (update[section].country!="USA")
            update[section].errors = [<div>Bow & Drape is not responsible for any additional import fees that arise after the item has left the United States</div>];
        }
      }
      this.setState(update);
    }
  }

  renderInputCredit() {
    return (
      <input_credit>
        <section>Payment Info</section>
        {this.state.card.errors.length?<errors>{this.state.card.errors}</errors>:null}
        <row>
          <div>
            <label>Card Number</label>
            <input type="text" onChange={this.handleFieldChange.bind(this, "card")} value={this.state.card.number} name="number"/>
          </div>
          <div>
            <label>cvc</label>
            <input type="text" onChange={this.handleFieldChange.bind(this, "card")} value={this.state.card.cvc} name="cvc"/>
          </div>
        </row><row>
          <div>
            <label>Exp Month</label>
            <input type="text" onChange={this.handleFieldChange.bind(this, "card")} value={this.state.card.exp_month} name="exp_month"/>
          </div>
          <div>
            <label>Exp Year</label>
            <input type="text" onChange={this.handleFieldChange.bind(this, "card")} value={this.state.card.exp_year} name="exp_year"/>
          </div>
        </row>
      </input_credit>
    );
  }

  // call when payment gets submitted
  handlePay() {
    if (this.state.processing_payment) return;
    this.setState({processing_payment:true});

    // make sure we have all the mandatory data we need
    let shipping_errors = [];
    let card_errors = [];
    if (!this.state.shipping.email)
      shipping_errors.push(<div>Please enter email address</div>);
    if (!this.state.shipping.street)
      shipping_errors.push(<div>If you don't tell us where to ship it, we're keeping it and wearing it</div>);
    this.handleSetSectionState("shipping", {errors: shipping_errors});
    this.handleSetSectionState("card", {errors: card_errors});
    if (shipping_errors.length || card_errors.length) {
      return this.setState({processing_payment:false});
    }

    // credit card info goes to the payment gateway ONLY, not to our servers
    // the payment handling gateway then gives us a nonce to reference that
    // client's payment info, and this is what we pass back to the server to
    // initiate the billing
    payment_method_client.getClientNonce(this.props.payment_authorization, this.state, (err, payment_nonce) => {
      if (err) {
        this.setState({processing_payment:false});
        this.handleSetSectionState("card", {errors: [err]});
        return;
      }
      let payload = {
        store_id: this.props.store[0].id,
        email: this.state.shipping.email,
        contents: this.refs.Items.state.contents,
        payment_nonce: payment_nonce,
        address: this.state.shipping,
        delivery_promised: this.countBusinessDays((this.state.shipping_quote ? this.state.shipping_quote.days : 5) + this.estimateManufactureTime(this.state.items)),
      }
      BowAndDrape.api("POST", "/order", payload, (err, resp) => {
        if (err) {
          return this.handleSetSectionState("card", {errors: [err.error]});
        }
        BowAndDrape.cart_menu.update([]);
        this.setState({done:true});
      });
    });
  } // handlePay()

  render() {
    if (this.state.done)
      return <ThanksPurchaseComplete />;

    return (
      <div>
        <item>Shipping on or before <Timestamp time={this.countBusinessDays(this.estimateManufactureTime(this.state.items))} /></item>
        <Items ref="Items" contents={this.state.items} is_cart="true" />
        {this.state.errors.length?<errors>{this.state.errors}</errors>:null}
        <InputAddress section_title="Shipping Address" handleFieldChange={this.handleFieldChange.bind(this, "shipping")} handleSetSectionState={this.handleSetSectionState.bind(this, "shipping")} {...this.state.shipping}/>
        same billing address <input onChange={this.handleSameBillingToggle.bind(this)} type="checkbox" checked={this.state.same_billing} />
        {this.state.same_billing?null:<InputAddress section_title="Billing Address" handleFieldChange={this.handleFieldChange.bind(this, "billing")} handleSetSectionState={this.handleSetSectionState.bind(this, "billing")} {...this.state.billing}/>}
        {this.renderInputCredit()}

        {/* TODO display loading state when this.state.processing_payment */}
        <button onClick={this.handlePay.bind(this)}>Get it!</button>

        <script type="text/javascript" src="https://js.stripe.com/v2/"></script>
        <script dangerouslySetInnerHTML={{__html:`
          if ("${process.env.STRIPE_KEY}"!="undefined")
            Stripe.setPublishableKey("${process.env.STRIPE_KEY}");
        `}} >
        </script>
      </div>
    );
  }
}

module.exports = Cart;
