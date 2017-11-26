
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

    let queriesObj = {
      sum: {
        string: "SELECT sum(cast(payments#>>'{0, price}' as float)/100) FROM shipments WHERE requested>$1 AND requested<$2 AND to_id!=$3",
        props: [start_date, stop_date, 'e03d3875-d349-4375-8071-40928aa625f5'],
      },
    };

    let queries = [];
  	for (let query in queriesObj) {
    	if (queriesObj.hasOwnProperty(query)) {
        queries.push((callback) => {
          SQLTable.sqlQuery(null, queriesObj[query]["string"], queriesObj[query]["props"], callback)
        });
      }
  	}
    // TODO Add more queries
    async.parallel(queries, (err, results) => {
      // results[0] should be the results from the callback of the 0th query
      metricsCallback(null, results[0]);
    });
  }

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
