
require('node-jsx-babel').install();
require('dotenv').config();

const async = require('async');
const Shipment = require('../models/Shipment');
const Facility = require('../models/Facility');
const Signup = require('../models/Signup');
const User = require('../models/User');

let queries = [];

Shipment.getAll({
  to_id: Facility.special_ids.customer_ship,
  page: {
    direction: "ASC",
    sort: "requested",
  },
}, (err, shipments) => {
  if (err || !shipments) return console.log(err);
  shipments.forEach((shipment) => {
    if (!Signup.isEmail(shipment.email)) return;
    let user = new User({email:shipment.email});
    user.props.latest_purchase = shipment.requested;

    queries.push(function(query_callback) {
      user.upsert((err)=>{
        query_callback(err);
      });
    });
  });

  async.series(queries, function(err, data) {
    console.log(`updated ${data.length} entries`);
    if (err) console.log(err)
    process.exit();
  });
});

