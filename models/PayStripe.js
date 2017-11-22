
const stripe = require('stripe')(process.env.STRIPE_SECRET);

class PayStripe {
  static getClientNonce(authorization, state, callback) {
    let stripe_payload = {
      number: state.card.number,
      cvc: state.card.cvc,
      exp_month: state.card.exp_month,
      exp_year: state.card.exp_year,
      address_zip: state.same_billing ?
        state.shipping.postal : state.billing.postal
    }
    Stripe.card.createToken(stripe_payload, (status, response) => {
      if (response.error)
        return callback(response.error.message);
      callback(null, response.id);
    });
  }

  static charge(shipment, nonce, amount, callback) {
    // stripe "usd" amounts are in pennies =(
    return stripe.charges.create({
      amount: amount*100,
      currency: "usd",
      source: nonce,
      metadata: {
        shipment_id: shipment.id,
        email: shipment.email,
        name: shipment.billing_address?shipment.billing_address.name:"",
      },
    }, (err, charge) => {
      if (err) {
        return callback("Could not process credit transaction! "+err.message);
      }
      if (!charge.paid) {
        return callback("Credit transaction denied "+charge.outcome.reason);
      }
      callback(null, {
        type: "stripe",
        amount: charge.amount,
      });
    });
  }
}
module.exports = PayStripe;

