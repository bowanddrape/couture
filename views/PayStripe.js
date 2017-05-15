
class PayStripe {
  static pay(state, callback) {

    let stripe_payload = {
      number: state.card.number,
      cvc: state.card.cvc,
      exp_month: state.card.exp_month,
      exp_year: state.card.exp_year,
      address_zip: state.same_billing ?
        state.shipping.postal : state.billing.postal
    }
    Stripe.card.createToken(stripe_payload, callback);
  }
}
module.exports = PayStripe;

