"use strict";

const React = require('react');
const ReactDOM = require('react-dom');
const EventEmitter = require('events');
const jwt_decode = require('jwt-decode');

const LayoutMain = require('./LayoutMain.jsx');

class Dispatcher extends EventEmitter {
  constructor(props) {
    super(props);
  }
  handleAuth(auth_object) {
    if (!auth_object.token) {
      document.cookie = "token=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
      return this.emit('user', {});
    }
    let decoded = jwt_decode(auth_object.token);
    this.emit('user', decoded);
    // save cookie
    var d = new Date();
    d.setTime(d.getTime() + (30 *24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = "token=" + auth_object.token + ";" + expires + ";path=/";
  }
}


module.exports = {
  React: React,
  ReactDOM: ReactDOM,
  LayoutMain: LayoutMain,
  dispatcher: new Dispatcher()
};
