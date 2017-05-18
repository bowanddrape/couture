
const braintree_client = require('braintree-web').client;

class BraintreeClient {
  static getClientNonce(authorization, state, callback) {
    braintree_client.create({authorization}, (err, client) => {
      if (err) return callback(err);

      let data = {
        creditCard: {
          number: state.card.number,
          expirationDate: `${state.card.exp_month}/${state.card.exp_year}`,
          cvv: state.card.cvc,
          billingAddress: {
            postalCode: state.same_billing ? state.shipping.postal : state.billing.postal,
          },
        }
      }
      client.request({
        endpoint: 'payment_methods/credit_cards',
        method: 'post',
        data: data,
      }, (err, response) => {
        if (err) return callback(err.details.originalError.error.message);
        callback(err, response.creditCards[0].nonce);
      });
    });
  }
}
module.exports = BraintreeClient;
