require('node-jsx-babel').install();
require('dotenv').config();
const Mail = require('../models/Mail');
const Shipment = require('../models/Shipment');

Shipment.getAll({email:"peter@bowanddrape.com",tracking_code:"not_null",address:"not_null"}, (err, shipments) => {
  if (err) return console.log(err);

  if (!shipments || !shipments.length) process.exit();
  let shipment = shipments[shipments.length-1];
  shipment.email = 'peter@bowanddrape.com';
console.log("sending email");
  return Mail.sendPlacedEmail(shipment, () => {
process.exit();
  });
});

