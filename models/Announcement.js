
const React = require('react');
const ReactDOMServer = require('react-dom/server');

const JSONAPI = require('./JSONAPI');

class Announcement extends JSONAPI {
  constructor(announcement) {
    super();
    Object.assign(this, announcement);
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "announcement",
      pkey: "id",
      fields: ["start", "stop", "text"],
    };
  }
}
module.exports = Announcement;
