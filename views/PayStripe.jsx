
const React = require('react');
const InputAddress = require('./InputAddress.jsx');
const ThanksPurchaseComplete = require('./ThanksPurchaseComplete.jsx');

class PayStripe extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      errors: [],
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

    if (!this.props.items || !this.props.items.length) {
      this.state.errors.push(<div>Cart is empty</div>);
    }
    if (!this.props.store_id) {
      this.state.errors.push(<div>Config Error: Store not set</div>);
    }
  }

  componentDidMount() {
    // TODO fill in shipping info if we know it
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
        if (update[section].country && update[section].country!="USA") {
          if (!update[section].errors.length)
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

    let stripe_payload = {
      number: this.state.card.number,
      cvc: this.state.card.cvc,
      exp_month: this.state.card.exp_month,
      exp_year: this.state.card.exp_year,
      address_zip: this.state.same_billing ?
        this.state.shipping.postal : this.state.billing.postal
    }
    Stripe.card.createToken(stripe_payload, (status, response) => {
      if (response.error) {
        this.setState({processing_payment:false});
        this.handleSetSectionState("card", {errors: [response.error.message]});
        return;
      }
      let payload = {
        store_id: this.props.store_id,
        email: this.state.shipping.email,
        contents: this.props.items,
        stripe_token: response.id,
      }
      BowAndDrape.api("POST", "/order", payload, (err, resp) => {
        if (err) {
console.log(err);
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
        Bow & Drape Virtual Sample Sale
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

module.exports = PayStripe;
