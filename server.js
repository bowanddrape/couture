
require('newrelic');

require('node-jsx-babel').install();
require('dotenv').config();

const fs = require('fs');

const server = require('http').createServer();
const async = require('async');
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const multer = require('multer');
const compression = require('compression');
const Log = require('./models/Log.js');
const responseTime = require('response-time');
if (["stag", "prod"].indexOf(process.env.ENV)!=-1) {
  // override console.log and console.error
  ["log", "error"].forEach(function(level) {
    let oldMethod = console[level].bind(console);
    console[level] = function() {
      let message = "";
      for (let key in arguments) {
        if (message) message += ", ";
        if (Buffer.isBuffer(arguments[key]))
          message += arguments[key].inspect()
        else if (typeof arguments[key] === 'object')
          message += JSON.stringify(arguments[key]);
        else
          message += arguments[key];
      }
      oldMethod.apply(console, arguments);
      Log.message(message);
    };
  });
}

var aws = require('aws-sdk');
const multerS3 = require('multer-s3');
var s3 = new aws.S3({ accessKeyId: process.env.AWS_ACCESS_KEY, secretAccessKey: process.env.AWS_SECRET_KEY, region: process.env.AWS_REGION })
let upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'www.bowanddrape.com',
    acl: 'public-read',
    contentType: function(req, file, cb) {
      cb(null, file.mimetype);
    },
    contentDisposition: function(req, file, cb) {
      cb(null, `attachment; filename=${file.originalname}`);
    },
    key: function (req, file, cb) {
      let key = file.originalname;
      if (req.body.sku)
        key = req.body.sku;
      if (req.path.substring(1)=='order')
        key = Date.now();
      cb(null, ((process.env.ENV=='prod')?'':'staging/')+req.path.substring(1)+'_uploads/'+key);
    }
  }),
  limits: {
    fileSize: 500000
  }
})

const Signup = require('./models/Signup.js');
const User = require('./models/User.js');
const Order = require('./models/Order.js');
const Fulfillment = require('./models/Fulfillment.js');
const Inventory = require('./models/Inventory.js');
const Store = require('./models/Store.js');
const Shipment = require('./models/Shipment.js');
const Facility = require('./models/Facility.js');
const Component = require('./models/Component.js');
const PromoCode = require('./models/PromoCode.js');
const VSS = require('./models/VSS.js');
const Page = require('./models/Page.js');
const Dashboard = require('./models/Dashboard.js');
const Announcement = require('./models/Announcement.js');
const EmailCampaign = require('./models/EmailCampaign.js');

const LayoutMain = require('./views/LayoutMain');
const BowAndDrape = require('./views/BowAndDrape.jsx');

const MaintenanceMode = require('./views/MaintenanceMode.jsx');
const Placeholder = require('./views/Placeholder.jsx');

Facility.initMandatory([
    "customer_ship",
    "customer_pickup",
    "canceled",
    "returned",
    "manual_adjustment",
  ], (err, ids) => {
    process.env.facility_ids = JSON.stringify(ids);
});
Store.initMandatory([
    "webfront",
  ], (err, ids) => {
    process.env.store_ids = JSON.stringify(ids);
});

// enable gzip compression
app.use(compression());

// parse multipart form data
app.use(upload.any(), (err, req, res, next) => {
  if (err) return res.status(400).send({error:err.code+" for "+err.field});
  return next();
});

// nom nom cookies
app.use(cookieParser());

/* // CORS?
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin","*");
  res.header("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept");
  next();
});*/

app.use((req, res, next) => {
  if(req.header('x-forwarded-proto')=='http')
    return res.redirect(301, `https://${req.headers.host}${req.path}`);
  next();
});

// static assets
app.use((req, res, next) => {
  let options = {
    index:'index.html',
    maxAge: 600000,
  };
  // dependant on our request headers, we may be looking to return json
  if (!req.accepts('*/*') && req.accepts('application/json')) {
    options.index = 'index.json';
  }
  express.static(__dirname+'/public/dist', options)(req, res, next);
});
app.use(express.static(__dirname+'/public'));

app.use((req, res, next) => {
  req.path_tokens = req.url.split('?')[0].split('/').slice(1).filter((tok)=>{return tok});
  next();
});

// handle auth
app.use(User.handleAuthentication);

// log everything
app.use(responseTime((req, res, time) => {
  Log.webserverResponse(req, res, time);
}));

// handle API endpoints
app.use(User.handleHTTP);
app.use(Order.handleHTTP);
app.use(Fulfillment.handleHTTP);
app.use(Inventory.handleHTTP);
app.use(Store.handleHTTP);
app.use(Log.handleHTTP);
app.use(VSS.handleHTTP);
app.use(Dashboard.handleHTTP);
app.use((req, res, next) => {new Signup().handleHTTP(req, res, next);});
app.use((req, res, next) => {new Shipment().handleHTTP(req, res, next);});
app.use((req, res, next) => {new Component().handleHTTP(req, res, next);});
app.use((req, res, next) => {new PromoCode().handleHTTP(req, res, next);});
app.use((req, res, next) => {new Announcement().handleHTTP(req, res, next);});
app.use((req, res, next) => {new EmailCampaign().handleHTTP(req, res, next);});
app.use((req, res, next) => {new Page().handleHTTP(req, res, next);});

// handle pages
app.use(Page.handleRenderPage);


// render homepage
app.use(function(req, res, next) {
  if (req.url!="/") {
    return next();
  }

  return Page.render(req, res, MaintenanceMode, {});
});


app.use(function(req, res, next) {
  return Page.renderNotFound(req, res);
});

server.on('request', app);
server.listen(80, function () {
  console.log("restarted webserver");
});

process.on("uncaughtException", (err) => {
  if (["stag", "prod"].indexOf(process.env.ENV)!=-1) {
    return Log.message(err.stack, () => {
      process.exit(99);
    });
  }
  console.log(err.stack);
  process.exit(99);
});
