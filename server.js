
require('newrelic');

require('node-jsx-babel').install();
const fs = require('fs');

const server = require('http').createServer();
const async = require('async');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

const User = require('./models/User.js');
const Order = require('./models/Order.js');
const Facility = require('./models/Facility.js');
const Page = require('./models/Page.js');

const LayoutMain = require('./views/LayoutMain');
const BowAndDrape = require('./views/BowAndDrape.jsx');


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

// static assets
app.use(function(req, res, next) {
  let options = {index:'index.html'};
  // dependant on our request headers, we may be looking to return json
  if (!req.accepts('*/*') && req.accepts('application/json')) {
    options.index = 'index.json';
  }
  express.static(__dirname+'/public/dist', options)(req, res, next);
});
app.use(express.static(__dirname+'/public'));

// handle user and auth endpoints
app.use(User.handleAuthentication);
app.use(User.handleHTTP);

// handle API endpoints
app.use(Order.handleHTTP);
app.use(Facility.handleHTTP);

// handle pages
app.use(Page.handleHTTP);


// render homepage
app.use(function(req, res, next) {
  if (req.url!="/") {
    return next();
  }
  let content = React.createElement("content", {},
    React.createElement("img", {src:"/logo.svg"}),
    React.createElement("placeholder_content", {},
      React.createElement("button", {}, "Customize Your Own"),
      React.createElement("img", {src:"/placeholder.png"})
    )
  );
  let page = React.createElement(LayoutMain, {content:ReactDOMServer.renderToString(content)});
  return res.end(ReactDOMServer.renderToString(page));
});


app.use(function(req, res, next) {
  res.end("hello universe");
});

server.on('request', app);
server.listen(80, function () {
});


