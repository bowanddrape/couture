
require('node-jsx-babel').install();
require('dotenv').config();
const mysql = require('mysql');
const async = require('async');
const equal = require('deep-equal');

const Shipment = require('../models/Shipment.js');
const Facility = require('../models/Facility.js');
const Store = require('../models/Store.js');
const SQLTable = require('../models/SQLTable.js');
const Address = require('../models/Address.js');


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
      let query = "SELECT name, CONCAT('http://www.bowanddrape.com/',SUBSTR(image.directory_local,16),thumbnail_file_name) as image FROM part_option po, part_option_color poc, image WHERE po.id=poc.part_option_id AND poc.id="+part_option_color+" AND poc.front_image_id=image.id LIMIT 1";
      mysql_connection.query(query, function(err, rows, fields) {
        if (err) return query_callback(err);
        if (!rows[0]) return query_callback(err, {});
        return query_callback(err, {text:text, name:rows[0].name, image:rows[0].image.replace(/ /g,"%20")});
      });
    });
  }
  async.series(queries, function(err, data) {
    if (err) return callback(err);
    for (let i=0; i<data.length; i++) {
      if (data[i].text) {
        // remove all characters treated as whitespace
        let text = data[i].text.toUpperCase();
        text = text.split("").filter((letter) => {
          return !/[ ~]/.test(letter);
        }).join("");
        assembly.push({props:{image:data[i].image, name: data[i].name}, text: text});
      } else {
        assembly.push({props:{image:data[i].image, name: data[i].name}});
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
        rows[i].props = {name:rows[i].name,image:"http://www.bowanddrape.com/"+rows[i].directory_local.split('/').slice(4).join('/')+rows[i].canvas_file_name,price:rows[i].price};
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
  let query = "SELECT orders.id as order_id, UNIX_TIMESTAMP(orders.created_at) AS requested, UNIX_TIMESTAMP(ship_date) AS packed, email, CONCAT('{\"name\":\"',shipping_name,'\",\"street\":\"',shipping_addr1,' ',shipping_addr2,'\",\"locality\":\"',shipping_city,'\",\"region\":\"',shipping_state,'\",\"postal\":\"',shipping_zip,'\",\"country\":\"',shipping_country,'\"}') AS address, tracking_code, delivered_date FROM orders, user WHERE orders.user_id=user.id AND (status='Pending' OR status='Shipped' OR status='In Progress') ORDER BY orders.id DESC LIMIT 1000";
  mysql_connection.query(query, function(err, rows, fields) {
    if (err) return console.error(err);
    for (let i=0; i<rows.length; i++) {
      // if delivered in the future, remove
      get_items_queries.push(function(callback) {
        getLegacyItems(mysql_connection, rows[i].order_id, function(err, items) {
          let ret = {};
          Object.assign(ret, rows[i]);
          ret.contents = items;
          ret.placed = ret.requested;
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


// get store ids
Store.initMandatory(["haute"], (err, store_ids) => {
  let store_id = store_ids.haute;

  Facility.initMandatory(["customer_ship"], (err, facility_ids) => {

    getOrders((err, orders) => {
      orders.map((order_object) => {
        if (!order_object.contents.length) return;
        if (!order_object.email) return;

        // see if this order was already imported
        let query = `SELECT * FROM shipments WHERE props#>>'{imported}'='haute' AND props#>>'{legacy_id}'='${order_object.order_id}' LIMIT 1;`;
        SQLTable.sqlQuery(Shipment, query, [], (err, shipments) => {
          let shipment = (shipments&&shipments.length) ? shipments[0] : {};
          let imported_shipment = {
            to_id: facility_ids["customer_ship"],
            packed: order_object.packed,
            requested: order_object.requested,
            tracking_code: order_object.tracking_code.trim(),
            email: order_object.email,
            store_id,
            contents: order_object.contents,
            props: {imported: "haute", legacy_id: order_object.order_id},
          };
          let delivery_promised = new Date(order_object.delivered_date).getTime()/1000;
          if (!isNaN(delivery_promised))
            imported_shipment.delivery_promised = delivery_promised;
          try {
            imported_shipment.address = new Address(JSON.parse(order_object.address.replace(/\s+/g," ")));
          } catch (error) {
            imported_shipment.address = new Address({});
            console.log(order_object.order_id+" address error: "+order_object.address);
          }
          imported_shipment.address.email = order_object.email;

          shipment = new Shipment(shipment);
          let old_shipment = JSON.parse(JSON.stringify(shipment));
          shipment = Object.assign(shipment, imported_shipment);
          let new_shipment = JSON.parse(JSON.stringify(shipment));
          if (!equal(old_shipment, new_shipment)) {
            shipment.upsert((err)=> {
              if (err) console.log(err);
            });
            // FIXME looks like both babel and mysql have problems closing
            setTimeout(()=>{process.exit()}, 120000);
          }
        }); // get previous record if it was already imported
      }); // orders.map()
    }); // getOrders()
  }); // Facility.initMandatory()
}); // get store_id
