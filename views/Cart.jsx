
const React = require('react');
const equal = require('deep-equal');
const InputAddress = require('./InputAddress.jsx');
const Items = require('./Items.jsx');
const ItemUtils = require('./ItemUtils.js');
const ThanksPurchaseComplete = require('./ThanksPurchaseComplete.jsx');
const UserLogin = require('./UserLogin.jsx');
const Errors = require('./Errors.jsx');
const BADButton = require('./BADButton.jsx');

const payment_method_client = require('./PayStripeClient.js');
//const payment_method_client = require('./PayBraintreeClient.js');

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
      user: {},
      no_login_prompt: false,
      items: this.props.items,
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
    const payment_method = require('../models/PayStripe.js');
    //const payment_method = require('../models/PayBraintree.js');

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


  componentDidMount() {
    if (!this.props.ignoreWebCart) {
      // populate cart contents
      BowAndDrape.dispatcher.on("update_cart", this.updateContents.bind(this));
    }
    BowAndDrape.dispatcher.on("user", (user) => {
      this.setState({user});
      if (!user.email) return;
      // if the user is signed in, get latest shipping/billing info
      this.setState({no_login_prompt:true});
      let query = {email:user.email, page:JSON.stringify({sort:"requested", direction:"DESC", limit:1})};
      BowAndDrape.api("GET", "/shipment", query, (err, result) => {
        if (err || !result || !result.length) return;
        let shipping = result[0].address;
        let billing = result[0].billing_address;
        let same_billing = false;
        if (!billing || equal(shipping,billing)) {
          same_billing = true;
        }
        this.setState({shipping, billing, same_billing});
      });
      if (this.refs.Items)
        this.refs.Items.updateCredit(user.credits);
    });
  }

  updateContents(items) {
    Errors.clear();
    items = items || [];

    if (this.refs.Items)
          this.refs.Items.updateContents(items);

    if (!items.length)
      Errors.emitError(null, "Cart is empty");
  }

  handleToggleSameBilling(e) {
    this.setState((prevState) => {
      return {same_billing:!prevState.same_billing};
    });
  }

  handleToggleGuestCheckout(e) {
    this.setState((prevState) => {
      return {no_login_prompt:!prevState.no_login_prompt};
    });
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
        <section className="sectionTitle">Payment Info</section>
        <Errors label="card" />
        <div className="paymentWrap">
          <div className="cardNumWrap">
            <h5 style={{margin:"0"}}>Card Number</h5>
            <input className="cardNum" type="text" maxLength="22" onChange={this.handleFieldChange.bind(this, "card")} value={this.state.card.number} name="number" placeholder="Card Number"/>
            <input className="cardCvc" type="text" onChange={this.handleFieldChange.bind(this, "card")} value={this.state.card.cvc} name="cvc" placeholder="CVC"/>
          </div>
          <div className="cardExpWrap">
            <h5 style={{margin:"0"}}>Expiration Date</h5>
            <input className="expMonth" type="text" onChange={this.handleFieldChange.bind(this, "card")} value={this.state.card.exp_month} name="exp_month" placeholder="MM"/>
            <input className="expYear" type="text" onChange={this.handleFieldChange.bind(this, "card")} value={this.state.card.exp_year} name="exp_year" placeholder="YY"/>
          </div>
      </div>
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

    let payload = {
      store_id: this.props.store[0].id,
      email: this.state.shipping.email,
      contents: this.refs.Items.state.contents,
      address: this.state.shipping,
      billing_address: this.state.same_billing ? this.state.shipping : this.state.billing,
      delivery_promised: this.refs.Items.countBusinessDays(this.refs.Items.state.shipping_quote.days + this.refs.Items.estimateManufactureTime(this.refs.Items.state.contents)),
    }

    let placeOrder = (payload) => {
      BowAndDrape.api("POST", "/order", payload, (err, resp) => {
        if (err) {
          this.setState({processing_payment:false});
          return Errors.emitError(null, err);
        }

        // save our successfully placed order payload
        this.order_payload = payload;

        // google track event
        try {
          let total_price = ItemUtils.getPrice(resp.shipment.contents)
          let google_items = resp.shipment.contents.map((item) => {
            return {
              id: item.sku,
              name: item.props.name,
              price: item.props.price,
              quantity: (item.quantity || 1),
            }
          });
          gtag('event', 'purchase', {
            transaction_id: resp.shipment.id,
            value: total_price,
            currency: 'usd',
            items: google_items,
          });
        } catch(err) {console.log(err)}
        // facebook track event
        try {
          let total_price = ItemUtils.getPrice(this.order_payload.contents)
          fbq('track', 'Purchase', {value: total_price, currency: 'USD'});
        } catch(err) {console.log(err)}

        BowAndDrape.cart_menu.update([]);
        this.setState({done:true});
        // we need to update the user, as account credits may have changed
        BowAndDrape.api("POST", "/user/login", {}, (err, resp) => {
          BowAndDrape.dispatcher.handleAuth(resp);
        });
      });
    };

    // if the user owes nothing, don't bother hitting the payment gateway
    if (ItemUtils.getPrice(payload.contents)==0) {
      return placeOrder(payload);
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
      payload.payment_nonce = payment_nonce;
      placeOrder(payload);
    });
  } // handlePay()

  render() {
    if (this.state.done){
      if (document) document.querySelector("body").scrollTop = 0;
      return <ThanksPurchaseComplete
        items={this.order_payload.contents}
        email={this.order_payload.email}
        is_cart={false}
      />;
    }

    // see if we need to show payment components
    let payment_info = null;
    let total_price = undefined;
    if (this.refs.Items) {
      total_price = ItemUtils.getPrice(this.refs.Items.state.contents);
    }
    if (total_price > 0) {
      payment_info = (
          <div className="cardInput">
            {this.renderInputCredit()}
          </div>
      );

    } // total_price > 0

    return (
      <div className="cart-wrapper grid">
        <h2 className="cart_header">My Cart</h2>
        <Items
          ref="Items"
          contents={this.state.items}
          onUpdate={(items)=>{this.setState({items:items.contents})}}
          is_cart="true"
        />
      
        { this.state.user.email ? null :
          <div className="checkout_section">
            <section className="loginHeader">
              <h4>Check Out</h4>
            </section>
            <section className="loginToggle">
              <form>
                <input type="radio" name="checkout" value="false" defaultChecked={true} onChange={this.handleToggleGuestCheckout.bind(this)}/> <span className="radio_label">Login</span>
                <input type="radio" name="checkout" value="true" onChange={this.handleToggleGuestCheckout.bind(this)}/><span className="radio_label">Checkout As Guest</span>
              </form>
            </section>
          <section className={this.state.no_login_prompt?"hidden":"cartLoginWrap"} >
              <UserLogin />
            </section>
          </div>
        }

        <Errors/>
        <section className={this.state.no_login_prompt?"addressArea":"hidden"}>
          <InputAddress section_title="Shipping Address" errors={<Errors label="shipping" />} handleFieldChange={this.handleFieldChange.bind(this, "shipping")} handleSetSectionState={this.handleSetSectionState.bind(this, "shipping")} {...this.state.shipping}/>
          <div className="billing-check">
            <form>
              <div className="radioWrap"><input type="radio" name="checkout" defaultChecked={this.state.same_billing} onChange={this.handleToggleSameBilling.bind(this)}/> <span className="radio_label">Same Billing address</span></div>
              <div className="radioWrap"><input type="radio" name="checkout" defaultChecked={!this.state.same_billing} onChange={this.handleToggleSameBilling.bind(this)}/> <span className="radio_label">Different Billing address</span></div>
            </form>
            { this.state.same_billing ? null :
              <InputAddress section_title="Billing Address" errors={<Errors label="billing"/>} handleFieldChange={this.handleFieldChange.bind(this, "billing")} handleSetSectionState={this.handleSetSectionState.bind(this, "billing")} {...this.state.billing}/>
            }
          </div>
          {payment_info}
          <BADButton className="primary checkout_btn" onClick={this.handlePay.bind(this)}>
            Get it!
          </BADButton>
        </section>



{/* Needed by stripe, not needed by braintree */}
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
