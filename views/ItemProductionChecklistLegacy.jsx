
const React = require('react');
const mysql = require('mysql');
const async = require('async');

const ItemProductionChecklist = require('./ItemProductionChecklist.jsx');

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
        return query_callback(err, {text:text, name:rows[0].name});
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
  let query = "SELECT CONCAT_WS(',',od.name,od.size,color.color_name,color.fabric_name) AS name, od.quantity, od.prerender_key, pr.prerender_key_long, od.product_id, image.directory_local, image.canvas_file_name FROM order_details od, product_pre_render pr, color, image WHERE od.order_id='"+order_id+"' AND image.id=od.front_image_id AND od.prerender_key=pr.prerender_key AND pr.color_id=color.id";
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
        rows[i].image = "http://www.bowanddrape.com/"+rows[i].directory_local.split('/').slice(4).join('/')+rows[i].canvas_file_name;
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

class ItemProductionChecklistLegacy extends React.Component {
  constructor(props) {
    super(props);
  }

  static preprocessProps(options, callback) {
    let mysql_connection = mysql.createConnection({
      host     : 'mysqldb.cpb9sj1nzvlm.us-east-1.rds.amazonaws.com',
      user     : 'zoora',
      password : 'zoora121!',
      database : 'zoora'
    });
    mysql_connection.connect();

    let get_items_queries = [];
    let query = "SELECT id, CONVERT_TZ(created_at,'UTC','EST') AS created_at, estimated_ship_date, CONCAT('<span class=\"name\">',shipping_name,'</span><span class=\"locality\">',shipping_addr1,' ',shipping_addr2,'</span><span class=\"locality\">',shipping_city,'</span><span class=\"region\">',shipping_state,'</span><span class=\"postal\">',shipping_zip,'</span><span class=\"country\">',shipping_country,'</span>') AS address FROM orders WHERE status='In Progress' ORDER BY id ASC";
    if (options.date) {
      let date = new Date(options.date);
      let mysql_date = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
      query = "SELECT id, CONVERT_TZ(created_at,'UTC','EST') AS created_at, CONVERT_TZ(estimated_ship_date,'UTC','EST') AS estimated_ship_date, CONCAT('<span class=\"name\">',shipping_name,'</span><span class=\"locality\">',shipping_addr1,' ',shipping_addr2,'</span><span class=\"locality\">',shipping_city,'</span><span class=\"region\">',shipping_state,'</span><span class=\"postal\">',shipping_zip,'</span><span class=\"country\">',shipping_country,'</span>') AS address FROM orders WHERE created_at > CONVERT_TZ('"+mysql_date+"','EST','UTC') AND created_at < CONVERT_TZ('"+mysql_date+"','EST','UTC')+ INTERVAL 1 DAY";
      // TODO this summarize_skus option is a hack, purge it later?
      if (options.summarize_skus) {
        query += " AND (status='In Progress' OR status='shipped')";
      } else {
        query += " AND status='In Progress' ORDER BY id ASC";
      }
    }
    mysql_connection.query(query, function(err, rows, fields) {
      if (err) return callback(err);
      for (let i=0; i<rows.length; i++) {
        get_items_queries.push(function(callback) {
          getLegacyItems(mysql_connection, rows[i].id, function(err, items) {
            callback(err, {
              id: rows[i].id,
              address: rows[i].address,
              date_to_ship: rows[i].estimated_ship_date,
              date_ordered: rows[i].created_at,
              items:items
            });
          });
        });
      } // iterate order rows

      async.parallel(get_items_queries, function(err, orders) {
        mysql_connection.end();
        let ret = {orders: Object.values(orders)};
        if (options.summarize_skus)
          ret.summarize_skus = options.summarize_skus;
        if (options.date)
          ret.date = options.date;
        callback(err, ret);
      })
    });

  }

  render() {
    return (
      React.createElement(ItemProductionChecklist, this.props)
    );
  }
}

module.exports = ItemProductionChecklistLegacy;
