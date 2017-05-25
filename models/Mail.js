
const sendmail = require('sendmail')({
  logger: {
    debug: ()=>{},
    info: ()=>{},
    warn: ()=>{},
    error: console.error
  },
  silent: true,
  dkim: false/*{ // TODO we need this 
    privateKey: fs.readFileSync('./dkim-private.pem', 'utf8'),
    keySelector: 'mydomainkey'
  },
*/
});
const LayoutEmail = require('../views/LayoutEmail.jsx');
const OrderShippedEmail = require('../views/OrderShippedEmail.jsx');
const OrderSurveyEmail = require('../views/OrderSurveyEmail.jsx');
const Page = require('./Page');

/***
Interface to send mail
Helps build and send out email
***/
class Mail {

  static send(to, subject, html, callback) {
    let options = {
      from: 'no-reply@bowanddrape.com',
      to: to,
      bcc: 'peter+testing@bowanddrape.com, shelly+testing@bowanddrape.com',
      subject: subject,
      html: html,
    };

    sendmail(options, function(err, reply) {
      if (err) {
        console.log("sendmail error");
        console.log(err && err.stack);
      }
      if (callback) callback(err, reply);
    });
  }

  static sendShippedEmail(shipment, callback) {
    // TODO this is the legacy haute props
    let props = {
      username: shipment.address.name,
      order_id: shipment.props.legacy_id,
      order_link: "http://www.bowanddrape.com/account/order?id="+shipment.props.legacy_id,
      tracking_link: "https://tools.usps.com/go/TrackConfirmAction.action?tLabels="+shipment.tracking_code
    }
    let body = Page.renderString(OrderShippedEmail, props, LayoutEmail);
    Mail.send(null, `Bow & Drape order ${props.order_id}`, body, (err) => {
      if (err) console.log(err);
      callback();
    });
  }

  static sendSurveyEmail(shipment, callback) {
    let props = {
      order_id: shipment.props.legacy_id,
      username: shipment.address.name,
    }
    let body = Page.renderString(OrderSurveyEmail, props, LayoutEmail);
    Mail.send(null, `Bow & Drape order ${props.order_id}`, body, (err) => {
      if (err) console.log(err);
      callback();
    });
  }
}

module.exports = Mail;
