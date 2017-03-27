
require('newrelic');

require('node-jsx-babel').install();
require('dotenv').config();

const fs = require('fs');

const server = require('http').createServer();
const async = require('async');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const multer = require('multer');
const compression = require('compression');
var aws = require('aws-sdk');
const multerS3 = require('multer-s3');
var s3 = new aws.S3({ accessKeyId: process.env.AWS_ACCESS_KEY, secretAccessKey: process.env.AWS_SECRET_KEY, region: process.env.AWS_REGION })
var upload = multer({
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
      cb(null, ((process.env.ENV=='prod')?'':'staging/')+req.path.substring(1)+'_uploads/'+Date.now());
    }
  })
})

const User = require('./models/User.js');
const Order = require('./models/Order.js');
const Fulfillment = require('./models/Fulfillment.js');
const Store = require('./models/Store.js');
const Shipment = require('./models/Shipment.js');
const Facility = require('./models/Facility.js');
const Component = require('./models/Component.js');
const Page = require('./models/Page.js');

const LayoutMain = require('./views/LayoutMain');
const BowAndDrape = require('./views/BowAndDrape.jsx');

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

// populate req.body with json body content
app.use(bodyParser.json());

// nom nom cookies
app.use(cookieParser());

/* // CORS?
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin","*");
  res.header("Access-Control-Allow-Headers","Origin, X-Rwquested-With, Content-Type, Accept");
  next();
});*/

app.use((req, res, next) => {
  if(req.header('x-forwarded-proto')=='http')
    return res.redirect(301, `https://${req.headers.host}${req.path}`);
  next();
});

// static assets
app.use((req, res, next) => {
  let options = {index:'index.html'};
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

// handle user and auth endpoints
app.use(User.handleAuthentication);
app.use(User.handleHTTP);

// handle API endpoints
app.use(upload.single('image'), Order.handleHTTP);
app.use(Fulfillment.handleHTTP);
app.use(Store.handleHTTP);
app.use((req, res, next) => {new Shipment().handleHTTP(req, res, next);});
app.use((req, res, next) => {new Component().handleHTTP(req, res, next);});
app.use((req, res, next) => {new Page().handleHTTP(req, res, next);});

// handle pages
app.use(Page.handleRenderPage);


// render homepage
app.use(function(req, res, next) {
  if (req.url!="/") {
    return next();
  }

  return Page.render(req, res, Placeholder, {});
});


app.use(function(req, res, next) {
  return Page.renderNotFound(req, res);
});

server.on('request', app);
server.listen(80, function () {
});


