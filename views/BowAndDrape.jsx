"use strict";

const React = require('react');
const ReactDOM = require('react-dom');
const EventEmitter = require('events');
const jwt_decode = require('jwt-decode');
const queryString = require('querystring');

const Customizer = require('./Customizer.js');
const Errors = require('./Errors.jsx');

/***
Okay, this is a namespace to wrap all the things needed globally on the client-
side.

Notably, BowAndDrape.dispatcher is a global event framework that anything client-side
can listen on or emit events on. Like using the ReDux framework, but since we're
using nodejs, we can just extend 'events' and make things look more symmetrical
between client and server code styles
***/


// helper function for reading cookies
let readCookie = function(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

// like reflux, but using the nodejs class EventEmitter
class Dispatcher extends EventEmitter {
  constructor(props) {
    super(props);
  }
  handleAuth(auth_object) {
    if (auth_object.error) {
      document.cookie = "token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      delete BowAndDrape.token;
      Errors.emitError("login", auth_object.error.toString());
      return this.emit('user', {error: auth_object.error});
    }
    if (!auth_object.token) {
      document.cookie = "token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      return this.emit('user', {});
    }
    let decoded = jwt_decode(auth_object.token);
    this.emit('user', decoded);
    // save cookie
    var d = new Date();
    d.setTime(decoded.exp*1000);
    var expires = "expires="+ d.toUTCString();
    document.cookie = "token=" + auth_object.token + ";" + expires + ";path=/";
    // also save it in memory for API auth
    BowAndDrape.token = auth_object.token;
    this.emit("authenticated");
  }
}
// setup things we always run when mounted
let dispatcher = new Dispatcher();
dispatcher.on("loaded", () => {
  // see if we have a user we need to set
  let token = BowAndDrape.readCookie("token");
  if (token) {
    dispatcher.handleAuth({token:token});
  }
  // google analytics
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
  ga('create', 'UA-52623236-1', 'auto');
  ga('send', 'pageview');
});

// helper function mostly for making XHR calls. Our API expects multipart form
// data and a json request header. Some calls need an auth token to take effect
let api = function(method, endpoint, body, callback) {
  // if we didn't, build GET querystring
  if (method=="GET" && !/\?/.test(endpoint))
    endpoint += "?"+queryString.stringify(body);
  // clear error messages on POST
  if (method == "POST")
    Errors.clear();
  let xhr = new XMLHttpRequest();
  xhr.open(method, endpoint, true);
  xhr.setRequestHeader("Accept","application/json");
  // busboy doesn't like if you set the content type, so comment this out
  //xhr.setRequestHeader("Content-Type", "multipart/form-data");
  if (BowAndDrape.token)
    xhr.setRequestHeader("Authorization", "Bearer "+BowAndDrape.token);
  else
    console.log("attempting api call while not logged in");
  xhr.onreadystatechange = function() {
    if (this.readyState!=4) { return; }
    if (this.status!=200)
      return callback(JSON.parse(this.responseText));
    callback(null, JSON.parse(this.responseText));
  }
  let payload = new FormData();
  if (body) {
    Object.keys(body).forEach((key) => {
      // if it's an object but not named file, stringify
      if (typeof(body[key])=='object' && !/file/.test(key))
        payload.append(key, JSON.stringify(body[key]));
      else
        payload.append(key, body[key]);
    });
  } // build payload
  xhr.send(payload);
} // api

module.exports = {
  React,
  ReactDOM,
  readCookie,
  // any interactable view MUST be listed here
  // FIXME script this?
  views: {
    LayoutMain: require('./LayoutMain.jsx'),
    UserPasswordReset: require('./UserPasswordReset.jsx'),
    FulfillShipments: require('./FulfillShipments.jsx'),
    ProductList: require('./ProductList.jsx'),
    Cart: require('./Cart.jsx'),
    Placeholder: require('./Placeholder.jsx'),
    PageList: require('./PageList.jsx'),
    Items: require('./Items.jsx'),
    ComponentsEdit: require('./ComponentsEdit.jsx'),
    Vss: require('./Vss.jsx'),
    VssAdmin: require('./VssAdmin.jsx'),
    Gallery: require('./Gallery.jsx'),
    Signup: require('./Signup.jsx'),
    TextContent: require('./TextContent.jsx'),
  },
  dispatcher,
  api,
  Customizer,
};
