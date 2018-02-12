
const React = require('react');
const querystring = require('querystring');
const Shipment = require('./Shipment.jsx');

/***
Query and display promo dashboard
***/
class DashboardPromos extends React.Component {

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

    let start = parseInt(options.start) || Math.round(new Date().getTime()/1000);
    let stop = parseInt(options.stop) || Math.round(new Date().getTime()/1000);

    let data_sources = [
      {
        key: "promo_orders",
        query: "WITH shipment_contents AS (SELECT *, jsonb_array_elements(contents) AS content_array FROM shipments WHERE requested>$1 AND requested<$2) SELECT * FROM shipment_contents WHERE content_array#>>'{props, name}' like 'Promo: %'",
        props: [start, stop],
      },
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

  render() {

    let shipments = [];
    this.props.promo_orders.forEach((order) => {  
      shipments.push(<Shipment key={order.id} {...order}/>);
    });

    let start = new Date(this.state.search_params.start*1000);
    let stop = new Date(this.state.search_params.stop*1000);

    return (
      <div className="dashboard promos">
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

        <div style={{padding:"20px"}}>
          <div>Total Num Orders: {shipments.length}</div>
        </div>

        {shipments}
      </div>
    )
  }
}

module.exports = DashboardPromos;
