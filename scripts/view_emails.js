require('node-jsx-babel').install();
require('dotenv').config();
const Mail = require('../models/Mail');
const Shipment = require('../models/Shipment');

let constraints = {
    tracking_code:"not_null",
    address:"not_null"
}

Shipment.getAll(constraints, (err, shipments) => {
  if (err) return console.log(err);
  let shipment = shipments[0];
  shipment.email = 'renee@bowanddrape.com';
  //console.log(JSON.stringify(shipment, null, 2));
  return Mail.sendShippedEmail(shipment, () => {
  });
});
