
require('node-jsx-babel').install();
require('dotenv').config();
const Mail = require('../models/Mail');
const Shipment = require('../models/Shipment');

// only send emails from prod
if (process.env.ENV!="prod")
  process.exit(0);

// FIXME paginate this
Shipment.getAll({tracking_code:"not_null",address:"not_null"}, (err, shipments) => {
  if (err) return console.log(err);
  if (!shipments) return;
  shipments.forEach((shipment) => {

    // send shipping confirmation email if not shipped yet
    if (!shipment.props.email_shipment && shipment.received>(new Date().getTime()/1000) && shipment.tracking_code) {
      return Mail.sendShippedEmail(shipment, () => {
        shipment.props.email_shipment = true;
        shipment.upsert();
      });
    }

    // send survey email 1 day after receipt
    if (!shipment.props.email_survey && (shipment.received+86400)<(new Date().getTime()/1000)) {
      return Mail.sendSurveyEmail(shipment, () => {
        shipment.props.email_survey = true;
        shipment.upsert();
      });
    }

  }); // shipments.forEach()
  // FIXME looks like babel has problems closing
  setTimeout(()=>{process.exit()}, 10000);
});

