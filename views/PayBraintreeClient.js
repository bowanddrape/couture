
const braintree = require('braintree-web');

const Errors = require('./Errors.jsx');
const ItemUtils = require('./ItemUtils.js');

class BraintreeClient {
  static getClientNonce(authorization, state, callback) {
    braintree.client.create({authorization}, (err, client) => {
      if (err) return callback(err);
      // make sure we have the info required
      if (!state.same_billing && (!state.billing || !state.billing.postal))
        return callback("Please fill in billing address");
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

  static drawPaypal(authorization, state, callback) {
    const container = "#paypal-button";
    if (!document.querySelector(container)) return;
    document.querySelector(container).innerHTML = "";
    braintree.client.create({authorization}, function (err, clientInstance) {
      if (err) return callback("client create error "+err);

      // Create a PayPal Checkout component.
      braintree.paypalCheckout.create({
        client: clientInstance
      }, function (err, paypalCheckoutInstance) {
        if (err) return callback("paypalCheckout create error "+err);

        let total_price = ItemUtils.getPrice(state.items);
        // Set up PayPal with the checkout.js library
        paypal.Button.render({
          env: 'sandbox',
          //env: 'production',
          payment: function () {
            return paypalCheckoutInstance.createPayment({
              flow: "checkout",
              intent: "sale",
              amount: total_price,
              currency: "USD",
              // docs are here http://braintree.github.io/braintree-web/current/PayPalCheckout.html#createPayment
            });
          },
          onAuthorize: function (data, actions) {
            return paypalCheckoutInstance.tokenizePayment(data)
              .then(function (payload) {
                callback(null, payload);
              });
          },
          onCancel: function (data) {
            console.log('checkout.js payment cancelled', JSON.stringify(data, 0, 2));
          },
          onError: function (err) {
            console.error('checkout.js error', err);
          }
        }, container).then(function () {
          // paypal button is ready
          document.querySelector("#paypal-loading").style.display = "none";
        });
      });
    });
  }
}
BraintreeClient.braintree = braintree;
module.exports = BraintreeClient;
