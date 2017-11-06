
require('node-jsx-babel').install();
require('dotenv').config();
const Mail = require('../models/Mail');
const Shipment = require('../models/Shipment');

// only send emails from prod
if (process.env.ENV!="prod")
  process.exit(0);

// FIXME paginate this
Shipment.getAll({address:"not_null"}, (err, shipments) => {
  if (err) return console.log(err);
  if (!shipments) return;
  shipments.forEach((shipment) => {

    // ignore all non-native orders?
    if (shipment.props && shipment.props.imported)
      return;

    // send order confirmation email
    if (!shipment.props || !shipment.props.email_confirmed) {
      return Mail.sendPlacedEmail(shipment, () => {
        shipment.props = shipment.props || {};
        shipment.props.email_confirmed = true;
        shipment.upsert();
      });
    }

    // send shipping confirmation email if not shipped yet
    if (!shipment.props.email_shipment && !shipment.received && shipment.tracking_code) {
      return Mail.sendShippedEmail(shipment, () => {
        shipment.props.email_shipment = true;
        shipment.upsert();
      });
    }

    // send survey email 1 day after receipt
    if (!shipment.props.email_survey && shipment.received && (shipment.received+86400)<(new Date().getTime()/1000)) {
      return Mail.sendSurveyEmail(shipment, () => {
        shipment.props.email_survey = true;
        shipment.upsert();
      });
    }

  }); // shipments.forEach()
  // FIXME looks like babel has problems closing
  setTimeout(()=>{process.exit()}, 120000);
});

