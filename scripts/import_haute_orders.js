
require('node-jsx-babel').install();
const mysql = require('mysql');
const async = require('async');

const Order = require('../models/Order.js');
const Shipment = require('../models/Shipment.js');
const SQLTable = require('../models/SQLTable.js');

function parseLegacyAssembly(mysql_connection, prerenderkey, callback) {
  // a b() in the prerenderkey means on the back
  let matches = prerenderkey.match(/_b\((.*)\)/);
  if(matches) {
    let array_key = prerenderkey.split('');
    array_key.splice(matches.index, matches[0].length);
    prerenderkey = array_key.join('')+'_'+matches[1];
  }
  let tokens = prerenderkey.split('_');
  let assembly = [];
  let queries = [];
  if (tokens.length<3) return callback(null, {});
  for (let i=2; i<tokens.length; i++) {
    let component_config = tokens[i].split('|');
    queries.push(function(query_callback) {
      // parse the crazy legacy string format
      let part_option_color = component_config[0];
      if (parseInt(part_option_color)!=part_option_color) {
        return query_callback(null, {});
      }
      let part_option_color_settings = component_config[1]?component_config[1].split('^') : [];
      let text = part_option_color_settings.length>3 ? decodeURIComponent(part_option_color_settings[0]) : "";
      let query = "SELECT name FROM part_option po, part_option_color poc WHERE po.id=poc.part_option_id AND poc.id="+part_option_color+" LIMIT 1";
      mysql_connection.query(query, function(err, rows, fields) {
        if (err) return query_callback(err);
        if (!rows[0]) return query_callback(err, {});
        return query_callback(err, {text:text, sku:rows[0].name});
      });
    });
  }
  async.series(queries, function(err, data) {
    if (err) return callback(err);
    for (let i=0; i<data.length; i++) {
      if (data[i].text) {
        // remove all characters treated as whitespace
        let text = data[i].text.toUpperCase();
        for (let letter=0; letter<text.length; letter++) {
          if (/[ ~]/.test(text[letter])) continue;
          assembly.push({name: data[i].name+": "+text[letter],text: text[letter]});
        }
      } else {
        assembly.push({name: data[i].name});
      }
    }
    callback(null, assembly);
  });
}

function getLegacyItems(mysql_connection, order_id, callback) {
  let query = "SELECT CONCAT_WS(',',od.name,od.size,color.color_name,color.fabric_name) AS name, od.price, od.quantity, od.prerender_key, pr.prerender_key_long, od.product_id, image.directory_local, image.canvas_file_name FROM order_details od, product_pre_render pr, color, image WHERE od.order_id='"+order_id+"' AND image.id=od.front_image_id AND od.prerender_key=pr.prerender_key AND pr.color_id=color.id";
  mysql_connection.query(query, function(err, rows, fields) {
    if (!rows) {
      return callback("order details for "+order_id+" not found");
    }
    let assembly_queries = [];
    for (let i=0; i<rows.length; i++) {
      if (rows[i].prerender_key_long) {
        rows[i].prerender_key = rows[i].prerender_key_long;
      }
      assembly_queries.push(parseLegacyAssembly.bind(this,mysql_connection,rows[i].prerender_key));
    }
    async.series(assembly_queries, function(err, assembly) {
      for (let i=0; i<rows.length; i++) {
        rows[i].assembly = assembly[i];
        rows[i].props = {image:"http://www.bowanddrape.com/"+rows[i].directory_local.split('/').slice(4).join('/')+rows[i].canvas_file_name,price:rows[i].price};
      }
      // return an array with a number of rows corresponding to the quantity
      var ret = [];
      for (let i=0; i<rows.length; i++) {
        let quantity = rows[i].quantity;
        rows[i].quantity = 1;
        for (let j=0; j<quantity; j++) {
          ret.push(rows[i]);
        }
      }
      callback(err, ret);
    });
  });
}



let mysql_connection = mysql.createConnection({
  host     : 'mysqldb.cpb9sj1nzvlm.us-east-1.rds.amazonaws.com',
  user     : 'zoora',
  password : 'zoora121!',
  database : 'zoora'
});
mysql_connection.connect();

let getOrders = function(callback) {
  let get_items_queries = [];
  let query = "SELECT orders.id as order_id, UNIX_TIMESTAMP(orders.created_at) AS requested, UNIX_TIMESTAMP(ship_date) AS packed, shipping_name AS name, email, CONCAT('{\"street_address\":\"',shipping_addr1,' ',shipping_addr2,'\",\"region\":',shipping_city,'\",\"locality\":\"',shipping_state,'\",\"postal_code\":\"',shipping_zip,'\",\"country\":\"',shipping_country,'\"}') AS address, tracking_code FROM orders, user WHERE orders.user_id=user.id ORDER BY orders.id DESC";
  mysql_connection.query(query, function(err, rows, fields) {
    if (err) return console.error(err);
    for (let i=0; i<rows.length; i++) {
      get_items_queries.push(function(callback) {
        getLegacyItems(mysql_connection, rows[i].order_id, function(err, items) {
          let ret = {};
          Object.assign(ret, rows[i]);
          ret.contents = items;
          ret.placed = ret.requested;
          ret.props = {imported: "haute"};
          callback(err, ret);
        });
      });
    } // iterate order rows

    async.parallel(get_items_queries, function(err, orders) {
      mysql_connection.end();
      let ret = Object.values(orders);
      callback(err, ret);
    })
  });
}

// FIXME this is destructive
//SQLTable.sqlExec("delete from shipments where from_id='c788aea6-4250-4a36-807c-47f7c9d46d14';", {}, (err) => {});
//SQLTable.sqlExec("delete from orders where store_id='c788aea6-4250-4a36-807c-47f7c9d46d14';", {}, (err) => {});


getOrders((err, orders) => {
  orders.map((order_object) => {
    if (!order_object.contents.length) return;
    if (!order_object.email) return;

//console.log(order_object);
    order_object.store_id = 'c788aea6-4250-4a36-807c-47f7c9d46d14';

    order = new Order(order_object);
    order.upsert((err, result) => {
      if (err) {
        return console.log(err);
      }

      if (order_object.tracking_code.trim()) {
        order_object.received = order_object.packed;
      }

      // add shipment detail
      let shipment = new Shipment({
        order_id: result.rows[0].id,
        packed: order_object.packed,
        requested: order_object.requested,
        received: order_object.received,
        tracking_code: order_object.tracking_code,
        store_id: 'c788aea6-4250-4a36-807c-47f7c9d46d14',
        from_id: 'c788aea6-4250-4a36-807c-47f7c9d46d14',
        contents: order_object.contents
      });
      shipment.upsert((err)=> {
        if (err) console.log(err);
      });
    });
  });
});