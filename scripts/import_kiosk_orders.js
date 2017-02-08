
require('node-jsx-babel').install();
const LineByLineReader = require('line-by-line');
const lr = new LineByLineReader(__dirname+'/total-orders.csv');
const Order = require('../models/Order.js');
const Shipment = require('../models/Shipment.js');

lr.on('error', function (err) {
  console.error(err);
});

lr.on('line', function (line) {
  let toks = line.split(/,/);
  let assembly = [];
  toks[12] = JSON.parse(toks.slice(13).join(","));
  for (var index in toks[12]) {
    assembly.push({sku:index, quantity:toks[12][index]});
  }
  let letters = toks[10].replace(/"/g,"").replace(/comma/g,',').split("");
  for (var i in letters) {
    assembly.push({sku:letters[i]});
  }
  let contents = [{sku:toks[9], assembly:assembly, props:{price: toks[8]}}];

  let order = new Order({
    store_id: 'c788aea6-4250-4a36-807c-47f7c9d46d14',
    placed: Math.round(new Date(toks[5]).getTime()/1000),
    email: toks[3],
    contents: contents,
    props: {imported: "kiosk"}
  });
  order.upsert((err, result) => {
    if (err) {
      return console.log(err);
    }
    // add shipment detail
    let shipment = new Shipment({
      order_id: result.rows[0].id,
      requested: Math.round(new Date(toks[5]).getTime()/1000),
      packed: Math.round(new Date(toks[6]).getTime()/1000),
      received: Math.round(new Date(toks[6]).getTime()/1000),
      from_id: 'c788aea6-4250-4a36-807c-47f7c9d46d14',
      contents: contents
    });
    shipment.upsert((err)=> {
      if (err) console.log(err);
    });
  });
});

lr.on('end', function () {
});
