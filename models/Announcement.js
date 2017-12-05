
const React = require('react');
const ReactDOMServer = require('react-dom/server');

const JSONAPI = require('./JSONAPI');
const Page = require('./Page');
const AnnouncementEdit = require('../views/AnnouncementEdit.jsx');

class Announcement extends JSONAPI {
  constructor(announcement) {
    super();
    Object.assign(this, announcement);
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "announcements",
      pkey: "id",
      fields: ["start", "stop", "text"],
    };
  }

  handleHTTPPage(req, res, next) {
    Announcement.getAll({}, (err, announcements) => {
      Page.render(req, res, AnnouncementEdit, {announcements});
    });
  }
}
module.exports = Announcement;
