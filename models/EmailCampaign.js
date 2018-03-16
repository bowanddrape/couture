
const JSONAPI = require('./JSONAPI');
const Page = require('./Page');
const EmailCampaigns = require('../views/EmailCampaigns.jsx');

class EmailCampaign extends JSONAPI {

  constructor(email_campaign) {
    super();
    Object.assign(this, email_campaign);
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "email_campaigns",
      pkey: "id",
      fields: ["query", "targets", "content", "props"]
    };
  }

  handleHTTPPage(req, res, next) {
    EmailCampaign.getAll({}, (err, campaigns) => {
      Page.render(req, res, EmailCampaigns, {campaigns});
    });
  }
}

module.exports = EmailCampaign;
