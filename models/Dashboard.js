
const MetricsDash = require('../views/MetricsDash.jsx');
const Page = require('./Page.js');
const Shipment = require('./Shipment.js');
const SQLTable = require('./SQLTable.js');
const async = require('async');


class Dashboard {


  static handleHTTP(req, res, next){
    // only handle this request if it's for us
    if (!req.path_tokens.length || req.path_tokens[0].toLowerCase()!=='dashboard')
      return next();

    // user must be admin
    if (!req.user || req.user.roles.indexOf("bowanddrape")==-1)
      return Page.renderNotFound(req, res);

    // Handle GET
    if (req.path_tokens.length==1 && req.method == 'GET'){
      return Dashboard.handleGET(req, res);
    }
    // Handle POST
    if (req.method == 'POST')
      return Dashboard.handlePOST(req, res);  //handle POST request

    return next();
  }

  static getMetrics(searchParams, metricsCallback) {
    let start_date = searchParams["start"];
    let stop_date = searchParams["stop"];

    let dashLogic = [
      {
        query:{
          string: "SELECT sum(cast(payments#>>'{0, price}' as float)/100) FROM shipments WHERE requested>$1 AND requested<$2 AND to_id!=$3",
          props: [start_date, stop_date, 'e03d3875-d349-4375-8071-40928aa625f5'],
        },
        format:{
          title: "Sales To-Date Total",
          columnNames: ["Total"],
          type: "sum",
          description: "",
        },
      },

      {
        query:{
          string: "SELECT CAST(CAST(to_timestamp(requested) AT TIME ZONE 'EST' AS DATE) AS TEXT), sum(cast(payments#>>'{0, price}' as float)/100), count(1) FROM shipments WHERE requested>$1 AND requested<$2 AND to_id!=$3 GROUP BY 1 ORDER BY 1;",
          props: [start_date, stop_date, 'e03d3875-d349-4375-8071-40928aa625f5'],
        },
        format:{
          title: "Daily Sales Total",
          columnNames: ["Date", "Total", "Order Count"],
          type: "daily_sum",
          description: "",
        },
      },
      {
        query:{
          string: "select * FROM metrics WHERE event_time>$1 AND event_time<$2",
          props: [start_date, stop_date],
        },
        format:{
          title: "Production Events",
          columnNames: ["name", "tag", "count"],
          type: "production",
          description: "",
        },
      },
      {
        query: {
          string: "SELECT inventory FROM inventory WHERE facility_id=$1",
          props: ['988e00d0-4b27-4ab4-ac00-59fcba6847d1'],
        },
        format: {
          title: "Inventory",
          columnNames: ["Item", "Quantity"],
          type: "inventory",
          description: "Inventory of facility 216",
        },
      },
    ];
    let queries = [];
    dashLogic.forEach((metric)=>{
      queries.push((callback) => {
        SQLTable.sqlQuery(null, metric.query.string, metric.query.props,
          (err, result) => {
            if(err) return callback;
            result.format = metric.format;
            return callback(err, result);
          }
        );
      });
    });

    async.parallel(queries, (err, results) => {
      // results[0] should be the results from the callback of the 0th query
      // format our data before sending it along
      let metrics = [];
      results.forEach((result) => {
        // return rows and format
        metrics.push({
          format: Object.assign({}, result.format),
          data: result["rows"],
        });
      });
      metricsCallback(null, metrics);
    });
  } // getMetrics()


  static handleGET(req, res) {
    // Manages all GET requests to /dashboard
    let props = {};
    return Page.render(req, res, MetricsDash, props);
  }  //  handleGET()

  static handlePOST(req, res) {
    Dashboard.getMetrics(req.body, (err, result)=>{
      if (err){
        // return some sort of error
        console.log("getMetrics Error", err);
        res.json({error: err}).end();
      }
      // return with ok and metrics
      res.json({ok: "ok", metrics: result}).end();
    });
  } // handlePOST
}

module.exports = Dashboard;
