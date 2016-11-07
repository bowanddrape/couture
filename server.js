
require('node-jsx-babel').install()
const fs = require('fs');

const server = require('http').createServer();
const async = require('async');
const express = require('express');
const app = express();
const React = require('react');
const ReactDOMServer = require('react-dom/server');

var BowAndDrape = require('./js/BowAndDrape.jsx');

var homepage = React.createElement(BowAndDrape.LayoutMain, {});
//console.log(ReactDOMServer.renderToString(homepage));

app.use(express.static(__dirname+'/public'));

// render homepage
app.use(function(req, res, next) {
  if (req.url!="/") {
    return next();
  }
  res.end();
  console.log("homepage");
});


app.use(function(req, res, next) {
  res.end("hello universe");
});

server.on('request', app);
server.listen(80, function () {
});


