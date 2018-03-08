
const React = require('react');
const querystring = require('querystring');
const Shipment = require('./Shipment.jsx');

/***
Query and display promo dashboard
***/
class ExportOrders extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      search_params: {
        start: parseInt(props.start) || Math.round(new Date().getTime()/1000),
        stop: parseInt(props.stop) || Math.round(new Date().getTime()/1000),
      },
    };
  }

  static preprocessProps(options, callback) {
    const async = require('async');
    const SQLTable = require('../models/SQLTable.js');
    const Facility = require('../models/Facility.js');

    let start = parseInt(options.start) || Math.round(new Date().getTime()/1000);
    let stop = parseInt(options.stop) || Math.round(new Date().getTime()/1000);

    let data_sources = [
      {
        key: "orders",
        query: "WITH shipment_contents AS (SELECT id, jsonb_array_elements(contents) AS content_line_item, from_id, to_id, requested, received, shipping_label_created, shipping_carrier_pickup, ship_by, delivery_promised, tracking_code, store_id, email, payments, address AS shipping_address, billing_address FROM shipments WHERE requested>$1 AND requested<$2 AND to_id=$3 ORDER BY requested ASC) SELECT * FROM shipment_contents",
        props: [start, stop, Facility.special_ids.customer_ship],
      }
    ];

    let queries = data_sources.map((source) => { return (callback) => {
        SQLTable.sqlQuery(null, source.query, source.props, callback);
      }
    });
    async.parallel(queries, (err, results) => {
      if (err) return callback(err);
      results.forEach((result, index) => {
        options[data_sources[index].key] = result.rows;
      });
      callback(null, options);
    });
  }

  handleInputChange(event) {
    let name = event.target.getAttribute("name");
    let value = event.target.value;

    this.setState((prevState) => {
      if (name=="start" || name=="stop") {
        try {
          value = new Date(value+" EST").getTime()/1000;
        } catch(err) {
          value = new Date(value).getTime()/1000;
        }
      }
      let search_params = Object.assign({}, this.state.search_params);
      search_params[name] = value;
      return ({search_params});
    }, () => {
      let url = `${document.location.origin}${document.location.pathname}?${querystring.stringify(this.state.search_params)}`;
      document.location.href = url;
    });
  }

  exportCSV(array, header, format) {
    let rows = [];
    rows.push(header.join(','));
    array.forEach((row) => {
      rows.push(format(row).join(','));
    });
    return rows.join("\n");
  }
  exportComponentUseCSV() {
    if (!this.props.component_use || !this.props.component_use.length || !this.props.component_use[0].skus)
      return "";
    return this.exportCSV(
      Object.keys(this.props.component_use[0].skus).sort(),
      ["sku", "quantity"],
      (row) => {
        return [row, this.props.component_use[0].skus[row]];
      }
    );
  }
  exportOrdersCSV() {
    if (!this.props.orders || !this.props.orders.length)
      return "";
    let order_keys = ["requested", "received", "shipping_label_created", "shipping_carrier_pickup", "ship_by", "delivery_promised", "email", "shipping_address"];
    let content_keys = ["name", "price"];

    return this.exportCSV(
      this.props.orders,
      ["order_id"].concat(["content_basesku", "content_tags"], content_keys.map((key)=>{return "content_"+key}), order_keys),
      (row) => {
        let data = [
          row.id,
          row.content_line_item.sku,
          row.content_line_item.tags?row.content_line_item.tags.join("|"):"",
        ];
        content_keys.forEach((key) => {
          let content = "";
          if (row.content_line_item.props[key])
            content = JSON.stringify(row.content_line_item.props[key]).replace(/,/g,"|").replace(/"/g,"");
          data.push(content);
        });
        order_keys.forEach((key) => {
          if (["requested", "received", "shipping_label_created", "shipping_carrier_pickup", "ship_by", "delivery_promised"].indexOf(key) != -1) {
            let date = new Date(parseFloat(row[key])*1000);
            return data.push(`${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`);
          }
          data.push(JSON.stringify(row[key]).replace(/,/g,"|").replace(/"/g,""));
        });
        return data;
      }
    );
  }

  render() {

    let start = new Date(this.state.search_params.start*1000);
    let stop = new Date(this.state.search_params.stop*1000);

    return (
      <div className="dashboard metrics">
        <div className="filter">
          <div>
            <label>Start Date: </label>
            <input
              type="date"
              onChange={this.handleInputChange.bind(this)}
              value={start.toISOString().substr(0,10)}
              name="start"
            />
          </div>
          <div>
            <label>Stop Date: </label>
            <input
              type="date"
              onChange={this.handleInputChange.bind(this)}
              value={stop.toISOString().substr(0,10)}
              name="stop"
            />
          </div>
        </div>

        <a className="export cta" href={"data:text/csv;charset=utf-8,"+encodeURIComponent(this.exportOrdersCSV())} download="orders.csv">
          download orders
        </a>

      </div>
    )
  }
}

module.exports = ExportOrders;
