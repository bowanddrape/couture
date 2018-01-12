
const React = require('react');
const querystring = require('querystring');
const Shipment = require('./Shipment.jsx');

/***
Query and display promo dashboard
***/
class DashboardMetrics extends React.Component {

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
        key: "orders_by_day",
        query: "SELECT EXTRACT(EPOCH FROM CAST(to_timestamp(requested) AT TIME ZONE 'EST' AS DATE)) AS date, sum(cast(payments#>>'{0, price}' as float)) AS revenue, count(1) AS count FROM shipments WHERE requested>$1 AND requested<$2 AND to_id!=$3 GROUP BY 1 ORDER BY 1;",
        props: [start, stop, Facility.special_ids.canceled],
      }, {
        key: "component_use",
        query: "SELECT assembly_extract_skus(jsonb_agg(contents)) AS skus FROM shipments WHERE requested>$1 AND requested<$2 AND to_id=$3",
        props: [start, stop, Facility.special_ids.customer_ship],
      }, {
        key: "factory_metrics",
        query: "select * FROM metrics WHERE event_time>$1 AND event_time<$2",
        props: [start, stop],
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

  componentDidMount() {

    let orders_by_day_price = {
      name: "revenue",
      yAxis: 1,
      data: [],
    };
    let orders_by_day_count = {
      name: "num orders",
      data: [],
    };
    if (this.props.orders_by_day) {
      this.props.orders_by_day.forEach((datapoint) => {
        if (datapoint.revenue)
          orders_by_day_price.data.push([datapoint.date*1000, datapoint.revenue]);
        if (datapoint.count)
          orders_by_day_count.data.push([datapoint.date*1000, parseInt(datapoint.count)]);
      });
    }

    let time_series = [];
    time_series.push(orders_by_day_price);
    time_series.push(orders_by_day_count);

    Highcharts.chart('time_container', {
      chart: {
        type: 'spline'
      },
      title: {
        text: 'Metrics'
      },
      xAxis: {
        type: 'datetime',
        title: {
          text: 'Date'
        }
      },
      yAxis: [{
        title: {
          text: 'count'
        },
        min: 0,
      },{
        title: {
          text: 'value'
        },
        min: 0,
        opposite: true,
      }],
      tooltip: {
        headerFormat: '<b>{series.name}</b><br>',
        pointFormat: '{point.x:%e. %b}: {point.y:.2f}'
      },
      plotOptions: {
        spline: {
          marker: {
            enabled: true
          }
        }
      },
      series: time_series,
    });


    let inventory_series = [];
    if (this.props.component_use && this.props.component_use[0] && this.props.component_use[0].skus) {
      Object.keys(this.props.component_use[0].skus).sort().forEach((sku) => {
        inventory_series.push({
          name: sku,
          data: [this.props.component_use[0].skus[sku]],
        });
      });
    }
    Highcharts.chart('inventory_container', {
      chart: {
        type: 'column'
      },
      title: {
        text: 'Components'
      },
      xAxis: {
        categories: ['components'],
      },
      yAxis: {
        title: {
          text: 'count'
        },
        min: 0,
      },
      legend: {
        enabled: false,
      },
      tooltip: {
        headerFormat: '<b>{series.name}</b><br>',
        pointFormat: '{point.y:.0f}'
      },
      plotOptions: {
        column: {
          borderWidth: 0,
          pointPadding: 0,
          groupPadding: 0,
        }
      },
      series: inventory_series,
    });

    let factory_user_events = {};
    if (this.props.factory_metrics) {
      this.props.factory_metrics.forEach((metric) => {
        let key = `${metric.props.user} ${metric.props.tag}`;
        factory_user_events[key] = factory_user_events[key] || 0;
        factory_user_events[key] += 1;
      });
    }

    let factory_series = [];
    Object.keys(factory_user_events).sort().forEach((key) => {
      factory_series.push({
        name: key,
        data: [factory_user_events[key]],
      });
    });
    Highcharts.chart('factory_container', {
      chart: {
        type: 'column'
      },
      title: {
        text: 'Factory Events'
      },
      xAxis: {
        categories: ['user event'],
      },
      yAxis: {
        title: {
          text: 'count'
        },
        min: 0,
      },
      legend: {
        enabled: false,
      },
      tooltip: {
        headerFormat: '<b>{series.name}</b><br>',
        pointFormat: '{point.y:.0f}'
      },
      plotOptions: {
        column: {
          borderWidth: 0,
          pointPadding: 0,
          groupPadding: 0,
        }
      },
      series: factory_series,
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

  render() {

    let metrics = [];
    let total_revenue = 0;
    let total_orders = 0;
    if (this.props.orders_by_day) {
      this.props.orders_by_day.forEach((datapoint) => {
        total_revenue += datapoint.revenue;
        total_orders += parseInt(datapoint.count);
      });
    }

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

        <div style={{padding:"20px"}}>
          <div>Total Revenue: {total_revenue.toFixed(2)}</div>
          <div>Total Num Orders: {total_orders}</div>
        </div>

        <script src="https://code.highcharts.com/highcharts.js"></script>
        <script src="https://code.highcharts.com/modules/series-label.js"></script>
        <script src="https://code.highcharts.com/modules/exporting.js"></script>
        <div id="time_container"></div>

        <a className="export cta" href={"data:text/csv;charset=utf-8,"+encodeURIComponent(this.exportComponentUseCSV())} download="component_use.csv">
          download csv
        </a>
        <div id="inventory_container"></div>
        <div id="factory_container"></div>

      </div>
    )
  }
}

module.exports = DashboardMetrics;
