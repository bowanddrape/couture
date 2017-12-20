
const React = require('react');
const querystring = require('querystring');
const Shipment = require('./Shipment.jsx');

/***
Query and display promo dashboard
***/
class DashboardHome extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      search_params: {
        start: props.start || Math.round(new Date().getTime()/1000),
        stop: props.stop || Math.round(new Date().getTime()/1000),
      },
    };
  }

  static preprocessProps(options, callback) {
    const async = require('async');
    const SQLTable = require('../models/SQLTable.js');

    let start = options.start || Math.round(new Date().getTime()/1000);
    let stop = options.stop || Math.round(new Date().getTime()/1000);

    let data_sources = [
      {
        key: "orders_by_day",
        query: "SELECT CAST(CAST(to_timestamp(requested) AT TIME ZONE 'EST' AS DATE) AS TEXT), sum(cast(payments#>>'{0, price}' as float)/100), count(1) FROM shipments WHERE requested>$1 AND requested<$2 AND to_id!=$3 GROUP BY 1 ORDER BY 1;",
        props: [start, stop, 'e03d3875-d349-4375-8071-40928aa625f5'],
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
      if (name=="start" || name=="stop")
        value = new Date(value+" EST").getTime()/1000;
      let search_params = Object.assign({}, this.state.search_params);
      search_params[name] = value;
      return ({search_params});
    });
  }

  render() {

    let metrics = [];
    this.props.orders_by_day.forEach((datapoint) => {
      metrics.push(
        <div key={metrics.length}>
          {datapoint.toString()}
        </div>
      );
    });

    let start = new Date(this.state.search_params.start*1000);
    let stop = new Date(this.state.search_params.stop*1000);

    return (
      <div className="dashboard">
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
        <div style={{display:"flex"}}>
          <a className="button" href={`/dashboard/metrics?start=${this.state.search_params.start}&stop=${this.state.search_params.sstop}`}>Metrics</a>
          <a className="button" href={`/dashboard/promos?start=${this.state.search_params.start}&stop=${this.state.search_params.stop}`}>Promos</a>
        </div>
        {metrics}
      </div>
    )
  }
}

module.exports = DashboardHome;
