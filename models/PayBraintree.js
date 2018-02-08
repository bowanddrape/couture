const braintree_server = require('braintree');
const braintree = braintree_server.connect({
  environment: braintree_server.Environment[process.env.BRAINTREE_ENV],
  merchantId: process.env.BRAINTREE_MERCHANTID,
  publicKey: process.env.BRAINTREE_PUBLICKEY,
  privateKey: process.env.BRAINTREE_PRIVATEKEY,
});

// First call getClientAuthorization() to get the authorization, then call getClientNonce() with the user's payment info to get the nonce, then call charge()
class Braintree {
  static getClientAuthorization(callback) {
    braintree.clientToken.generate({}, function (err, response) {
      callback(err, response.clientToken);
    });
  }

  static charge(shipment, nonce, amount, callback) {
    braintree.transaction.sale({
      amount: amount,
      paymentMethodNonce: nonce,
      orderId: shipment.id,
      customer: {
        email: shipment.email,
      },
      billing: {
        firstName: shipment.billing_address.name,
        locality: shipment.billing_address.locality,
        postalCode: shipment.billing_address.postal,
        region: shipment.billing_address.region,
        streetAddress: shipment.billing_address.street,
      },
      shipping: {
        firstName: shipment.address.name,
        locality: shipment.address.locality,
        postalCode: shipment.address.postal,
        region: shipment.address.region,
        streetAddress: shipment.address.street,
      },
      options: {
        submitForSettlement: true
      },
    }, (err, result) => {
      if (err) {
        return callback(err);
      }
      if (!result.success) {
        return callback(result.message);
      }

      callback(null, {
        type:`braintree_${result.transaction.paymentInstrumentType}`,
        amount:result.transaction.amount,
      });
    });
  }
}
module.exports = Braintree;
