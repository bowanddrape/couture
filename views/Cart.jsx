
const React = require('react');
const InputAddress = require('./InputAddress.jsx');
const Items = require('./Items.jsx');
const ThanksPurchaseComplete = require('./ThanksPurchaseComplete.jsx');
const PayStripe = require('./PayStripe.js');

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
  }

  componentDidMount() {
    // TODO fill in shipping info if we know it
    if (BowAndDrape.cart_menu) {
      this.updateContents(BowAndDrape.cart_menu.state.contents);
    }
    BowAndDrape.dispatcher.on("update_cart", this.updateContents.bind(this));
  }
  updateContents(items) {
    items = items || [];
    this.refs.Items.updateContents(items);
    this.forceUpdate();
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

  handleSetSectionState(section, state) {
    let update = {};
    if (section) {
      update[section] = Object.assign(this.state[section], state);
      // special handling for shipping to display warning about customs
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

    // TODO select payment method
    let payment_method = PayStripe;
    payment_method.pay(this.state, (status, response) => {
      if (response.error) {
        this.setState({processing_payment:false});
        this.handleSetSectionState("card", {errors: [response.error.message]});
        return;
      }
      let payload = {
        store_id: this.props.store[0].id,
        email: this.state.shipping.email,
        contents: this.refs.Items.state.contents,
        stripe_token: response.id,
        address: this.state.shipping,
      }
      BowAndDrape.api("POST", "/order", payload, (err, resp) => {
        if (err) {
          return this.handleSetSectionState("card", {errors: [err.error]});
        }
        console.log(resp);
        this.setState({done:true});
      });
    });

  }

  render() {
    if (this.state.done)
      return <ThanksPurchaseComplete />;

    return (
      <div>
        <Items ref="Items" contents={this.state.items} is_cart="true"/>
        {this.state.errors.length?<errors>{this.state.errors}</errors>:null}
        <InputAddress section_title="Shipping Address" handleFieldChange={this.handleFieldChange.bind(this, "shipping")} handleSetSectionState={this.handleSetSectionState.bind(this, "shipping")} {...this.state.shipping}/>
        same billing address <input onChange={this.handleSameBillingToggle.bind(this)} type="checkbox" checked={this.state.same_billing} />
        {this.state.same_billing?null:<InputAddress section_title="Billing Address" handleFieldChange={this.handleFieldChange.bind(this, "billing")} handleSetSectionState={this.handleSetSectionState.bind(this, "billing")} {...this.state.billing}/>}
        {this.renderInputCredit()}

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
