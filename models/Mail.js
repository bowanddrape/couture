
const ses = require('node-ses');
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
    // Object to hold neccessary email properties
    let bccArray = [
      'peter+testing@bowanddrape.com',
      'shelly+testing@bowanddrape.com',
      'renee+testing@bowanddrape.com'
    ]
    let options = {
      from: 'no-reply@bowanddrape.com',
      to: to,
      bcc: bccArray,
      subject: subject,
      message: html,
    };

    // Create email client
    let client = ses.createClient({
      key: process.env.AWS_ACCESS_KEY,
      secret: process.env.AWS_SECRET_KEY,
    });

    // Send out the email!
    client.sendEmail(options, (err, data, res) =>{
      if (err){
        console.log("ses error");
        console.log(err && err.stack);
      }
      if(callback)
        callback(err, res);
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
    let body = Page.renderString([{component:OrderShippedEmail, props}], LayoutEmail);
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
    let body = Page.renderString([{component:OrderSurveyEmail, props}], LayoutEmail);
    Mail.send(null, `Bow & Drape order ${props.order_id}`, body, (err) => {
      if (err) console.log(err);
      callback();
    });
  }
}

module.exports = Mail;
