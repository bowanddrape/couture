
const ses = require('node-ses');
const LayoutEmail = require('../views/LayoutEmail.jsx');
const OrderShippedEmail = require('../views/OrderShippedEmail.jsx');
const OrderPlacedEmail = require('../views/OrderPlacedEmail.jsx');
const OrderSurveyEmail = require('../views/OrderSurveyEmail.jsx');
const Page = require('./Page');
const User = require('./User');

/***
Interface to send mail
Helps build and send out email
***/
class Mail {

  static send(to, subject, html, callback) {
    // Object to hold neccessary email properties
    let bccArray = [
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
    User.get(shipment.email, (err, user) => {
      if (err) return callback(err);
      if (!user) {
        user = new User({email: shipment.email});
      }
      User.generateJwtToken(user, (err, token) => {
        if (err) return callback(err);

        let props = {
          order_id: shipment.id,
          token: token,
          order_link: "https://www.bowanddrape.com/shipment/"+shipment.id+"?token="+token,
          tracking_link: "https://tools.usps.com/go/TrackConfirmAction.action?tLabels="+shipment.tracking_code,
          contents: shipment.contents,
        }
        let body = Page.renderString([{component:OrderShippedEmail, props}], LayoutEmail);
        Mail.send(shipment.email, `RE: Bow & Drape Order ${props.order_id.substr(props.order_id.length-6)}`, body, (err) => {
          if (err) return callback(err);
          callback();
        });
      }); // generate JWT token
    }); // get user
  }

  static sendPlacedEmail(shipment, callback) {
    User.get(shipment.email, (err, user) => {
      if (err) return callback(err);
      if (!user) {
        user = new User({email: shipment.email});
      }
      User.generateJwtToken(user, (err, token) => {
        if (err) return callback(err);

        // TODO this is the legacy haute props
        let props = {
          order_id: shipment.id,
          token: token,
          order_link: "https://www.bowanddrape.com/shipment/"+shipment.id+"?token="+token,
          contents: shipment.contents,
        }
        let body = Page.renderString([{component:OrderPlacedEmail, props}], LayoutEmail);
        Mail.send(shipment.email, `Bow & Drape Order ${props.order_id.substr(props.order_id.length-6)}`, body, (err) => {
          if (err) return callback(err);
          callback();
        });
      }); // generate JWT token
    }); // get user
  }

  static sendSurveyEmail(shipment, callback) {
    let props = {
      order_id: shipment.id,
      username: shipment.address.name,
    }
    let body = Page.renderString([{component:OrderSurveyEmail, props}], LayoutEmail);
    Mail.send(null, `RE: Bow & Drape order ${props.order_id}`, body, (err) => {
      if (err) console.log(err);
      callback();
    });
  }
}

module.exports = Mail;
