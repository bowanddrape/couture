
require('node-jsx-babel').install();
require('dotenv').config();

const equal = require('deep-equal');
const Shipment = require('../models/Shipment.js');

let total_shipments;
let shipments_queried = 0;

// this process doesn't close properly, so count when we're done
let incrementNumShipmentsQueried = () => {
  shipments_queried += 1;
  if (shipments_queried>=total_shipments)
    process.exit();
};

Shipment.getAll({received:"null",tracking_code:"not_null",page:{sort:"requested"}}, (err, shipments) => {
  if (err) return console.log(err);
  total_shipments = shipments.length;
  shipments.forEach((shipment, index) => {
    let old_shipment = JSON.parse(JSON.stringify(shipment));
    shipment.lookupTracking((err) => {
      let new_shipment = JSON.parse(JSON.stringify(shipment));
      if (equal(old_shipment, new_shipment))
        return incrementNumShipmentsQueried();
      shipment.upsert((err)=> {
        if (err) console.log(err);
        incrementNumShipmentsQueried();
      });
    });
  });
  // force close if this takes too long
  setTimeout(()=>{process.exit()}, 60000);
});
