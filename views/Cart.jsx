
const React = require('react');
const InputAddress = require('./InputAddress.jsx');
const Items = require('./Items.jsx');
const ThanksPurchaseComplete = require('./ThanksPurchaseComplete.jsx');
const UserLogin = require('./UserLogin.jsx');
const Errors = require('./Errors.jsx');

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
      items: this.props.items || [],
      card: {
        number: "",
        cvc: "",
        exp_month: "",
        exp_year: "",
        address_zip: null,
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
      },
      processing_payment: false,
      done: false,
    };

    if (!this.props.store[0].id) {
      Errors.emitError(null, "Error: Store not set");
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

  //  fill in shipping cost
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

    // For conditions like a Virtual Sample Sale
    // Ignore anything a user might have in an existing cart
    // Only VSS carts have the ignoreWebCart prop
    if ("undefined" === typeof this.props.ignoreWebCart) {
        //  Utilize the web cart
        if (BowAndDrape.cart_menu) {
          this.updateContents(BowAndDrape.cart_menu.state.contents);
        }
        BowAndDrape.dispatcher.on("update_cart", this.updateContents.bind(this));
    }
    // TODO: Do we need this for sample sales??
    this.updateContents(this.props.items);

    // if the user is signed in, get latest shipping/billing info
    BowAndDrape.dispatcher.on("user", (user) => {
      if (!user.email) return;
      let query = {email:user.email, page:JSON.stringify({sort:"requested", direction:"DESC", limit:1})};
      BowAndDrape.api("GET", "/shipment", query, (err, result) => {
        if (err || !result || !result.length) return;
        let shipping = result[0].address;
        let billing = result[0].billing_address;
        let same_billing = false;
        if (!billing || JSON.stringify(shipping)==JSON.stringify(billing)) {
          same_billing = true;
        }
        this.setState({shipping, billing, same_billing});
      });
    });
  }

  updateContents(items) {
    items = items || [];
    this.refs.Items.updateContents(items);
    this.setState({items});
    if (!items.length)
      Errors.emitError(null, "Cart is empty");
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
      let prev_state = this.state[section] || {};
      update[section] = Object.assign(prev_state, state);
      // special handling for shipping to display warning about customs
      // TODO put this somewhere else (maybe in render()?)
      if (section=="shipping") {
        if (state.country) {
          if (update[section].country!="USA")
            Errors.emitError("shipping", "Bow & Drape is not responsible for any additional import fees that arise after the item has left the United States");
        }
      }
      this.setState(update);
    }
  }

  renderInputCredit() {
    return (
      <input_credit>
        <section>Payment Info</section>
        <Errors label="card" />
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
    // clear out errors so we can fill them with new ones
    Errors.clear();

    // only allow the user to click once
    if (this.state.processing_payment) return;
    this.setState({processing_payment:true});

    // make sure we have all the mandatory data we need
    if (!this.state.shipping.email) {
      Errors.emitError("shipping", "Pease enter email address");
      return this.setState({processing_payment:false});
    }
    if (!this.state.shipping.street) {
      Errors.emitError("shipping", "If you don't tell us where to ship it, we're keeping it and wearing it");
      return this.setState({processing_payment:false});
    }

    // credit card info goes to the payment gateway ONLY, not to our servers
    // the payment handling gateway then gives us a nonce to reference that
    // client's payment info, and this is what we pass back to the server to
    // initiate the billing
    payment_method_client.getClientNonce(this.props.payment_authorization, this.state, (err, payment_nonce) => {
      if (err) {
        this.setState({processing_payment:false});
        Errors.emitError("card", err);
        return;
      }
      let payload = {
        store_id: this.props.store[0].id,
        email: this.state.shipping.email,
        contents: this.refs.Items.state.contents,
        payment_nonce: payment_nonce,
        address: this.state.shipping,
        billing_address: this.state.same_billing ? this.state.shipping : this.state.billing,
        delivery_promised: this.refs.Items.countBusinessDays(this.refs.Items.state.shipping_quote.days + this.refs.Items.estimateManufactureTime(this.state.items)),
      }
      BowAndDrape.api("POST", "/order", payload, (err, resp) => {
        if (err) {
          return Errors.emitError("card", err.error);
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
        <Errors />
        <Items ref="Items" contents={this.state.items} is_cart="true" />

        <UserLogin style={{margin:"10px auto",width:"480px",display:"block"}} cta="Login or proceed as Guest" />

        <InputAddress section_title="Shipping Address" errors={<Errors label="shipping" />} handleFieldChange={this.handleFieldChange.bind(this, "shipping")} handleSetSectionState={this.handleSetSectionState.bind(this, "shipping")} {...this.state.shipping}/>
        <div style={{margin:"auto",width:"480px"}}>same billing address <input onChange={this.handleSameBillingToggle.bind(this)} type="checkbox" checked={this.state.same_billing} /></div>
        {this.state.same_billing?null:<InputAddress section_title="Billing Address" errors={<Errors label="billing"/>} handleFieldChange={this.handleFieldChange.bind(this, "billing")} handleSetSectionState={this.handleSetSectionState.bind(this, "billing")} {...this.state.billing}/>}
        {this.renderInputCredit()}

        {/* TODO display loading state when this.state.processing_payment */}
        <button onClick={this.handlePay.bind(this)}>Get it!</button>

{/* Needed by stripe, not needed by braintree
        <script type="text/javascript" src="https://js.stripe.com/v2/"></script>
        <script dangerouslySetInnerHTML={{__html:`
          if ("${process.env.STRIPE_KEY}"!="undefined")
            Stripe.setPublishableKey("${process.env.STRIPE_KEY}");
        `}} >
        </script>
*/}
      </div>
    );
  }
}

module.exports = Cart;
