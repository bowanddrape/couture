
require('node-jsx-babel').install();
require('dotenv').config();
const Mail = require('../models/Mail');
const Page = require('../models/Page');
const Shipment = require('../models/Shipment');
const LayoutEmail = require('../views/LayoutEmail.jsx');
const OrderShippedEmail = require('../views/OrderShippedEmail.jsx');
const OrderSurveyEmail = require('../views/OrderSurveyEmail.jsx');

// only send emails from prod
if (process.env.ENV!="prod")
  process.exit(0);

let sendShippedEmail = function(shipment, callback) {
  if (!shipment.tracking_code) return;
  // TODO see if we have the user's name
  // TODO this is the legacy haute props
  let props = {
    username: shipment.address.name,
    order_id: shipment.props.legacy_id,
    order_link: "http://www.bowanddrape.com/account/order?id="+shipment.props.legacy_id,
    tracking_link: "https://tools.usps.com/go/TrackConfirmAction.action?tLabels="+shipment.tracking_code
  }
  let body = Page.renderString(OrderShippedEmail, props, LayoutEmail);
  Mail.send("peter+testing@bowanddrape.com", "Your order has shipped!", body, (err) => {
    if (err) return console.log(err);
    callback();
  });
  Mail.send("shelly+testing@bowanddrape.com", "Your order has shipped!", body, (err) => {});
}

let sendSurveyEmail = function(shipment, callback) {
  let props = {
    username: shipment.address.name,
  }
  let body = Page.renderString(OrderSurveyEmail, props, LayoutEmail);
  Mail.send("peter+testing@bowanddrape.com", "Bow & Drape Needs YOUR Feedback", body, (err) => {
    if (err) return console.log(err);
    callback();
  });
  Mail.send("shelly+testing@bowanddrape.com", "Bow & Drape Needs YOUR Feedback", body, (err) => {});
}

Shipment.getAll({tracking_code:"not_null"}, (err, shipments) => {
  if (err) return console.log(err);
  shipments.forEach((shipment) => {

    // send shipping confirmation email if not shipped yet
    if (!shipment.props.email_shipment && shipment.received>(new Date().getTime()/1000)) {
      return sendShippedEmail(shipment, () => {
        shipment.props.email_shipment = true;
        shipment.upsert();
      });
    }

    // send survey email 1 day after receipt
    if (!shipment.props.email_survey && (shipment.received+86400)<(new Date().getTime()/1000)) {
      return sendSurveyEmail(shipment, () => {
        shipment.props.email_survey = true;
        shipment.upsert();
      });
    }

  }); // shipments.forEach()
});

