
require('node-jsx-babel').install();
require('dotenv').config();

const async = require('async');
const Component = require('../models/Component');

let queries = [];

// I dumbly named factorysku factory_sku initially
Component.getAll({
}, (err, components) => {
  if (err || !components) return console.log(err);
  components.forEach((component) => {
    if (!component.props.factory_sku) return;
    component.props.factorysku = component.props.factory_sku;

    queries.push(function(query_callback) {
      component.upsert((err)=>{
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

