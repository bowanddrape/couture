
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

  static validateDate(dateString){
    // Make sure we don't have a janky date. Format is 'yyyy/mm/dd'
    if(!/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateString)){
      console.log("bad dateString");
      return false;
    }
    let epochDate = new Date(dateString).getTime()/1000;
    return epochDate;
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
          string: "SELECT date_trunc('day', to_timestamp(requested)) , sum(cast(payments#>>'{0, price}' as float)/100), count(1) FROM shipments WHERE requested>$1 GROUP BY 1 ORDER BY 1;",
          props: [start_date],
        },
        format:{
          title: "Daily Sales Total",
          columnNames: ["Date", "Total", "Order Count"],
          type: "daily_sum",
          description: "",
        },
      },
      {
        // select props#>>'{tag}' as tag, count(1) from metrics GROUP BY tag;
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
          props: ['83bcecf8-6881-4202-bb1c-051f77f27d90'],
        },
        format: {
          title: "Virtual Sample Sale Inventory",
          columnNames: ["Item", "Quantity"],
          type: "inventory",
          description: "Inventory of VSS facility",
        },
      },
      {
        query: {
          string: "SELECT inventory FROM inventory WHERE facility_id=$1",
          props: ['988e00d0-4b27-4ab4-ac00-59fcba6847d1'],
        },
        format: {
          title: "Factory 216 Inventory",
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

    let sp = Object.assign({}, req.body);
    let ep = {validated: true};
    // iterate through keys
  	for (let key in sp) {
    	if (sp.hasOwnProperty(key)) {
        let epochDate = Dashboard.validateDate(sp[key]);
        ep[key] = epochDate;
        ep["validated"] = (ep["validated"] && epochDate)? true:false;
      }
  	}
    if (ep["validated"]) {
      Dashboard.getMetrics(ep, (err, result)=>{
        if (err){
          // return some sort of error
          console.log("getMetrics Error", err);
          res.json({error: err}).end();
        }
        // return with ok and metrics
        res.json({ok: "ok", metrics: result}).end();
      });
    }
  } // handlePOST
}

module.exports = Dashboard;
