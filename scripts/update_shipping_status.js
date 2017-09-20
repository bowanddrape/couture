
require('node-jsx-babel').install();
require('dotenv').config();

const equal = require('deep-equal');
const Shipment = require('../models/Shipment.js');

Shipment.getAll({received:"null",tracking_code:"not_null"}, (err, shipments) => {
  if (err) console.log(err);
  shipments.forEach((shipment) => {
    let old_shipment = JSON.parse(JSON.stringify(shipment));
    shipment.lookupTracking((err) => {
      if (err) console.log(JSON.stringify(err));
      let new_shipment = JSON.parse(JSON.stringify(shipment));
      if (equal(old_shipment, new_shipment)) return;

      shipment.upsert((err)=> {
        if (err) console.log(err);
      });
    });
  });
  // force close if this takes too long
  setTimeout(()=>{process.exit()}, 10000);
});
