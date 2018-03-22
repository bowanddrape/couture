
const JSONAPI = require('./JSONAPI');
const SQLTable = require('./SQLTable');
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
    if (req.path_tokens.length>1) {
      return EmailCampaign.get(req.path_tokens[1], (err, campaign) => {
        if (err || !campaign) return Page.renderNotFound(req, res);
        if (req.path_tokens[2] == "export_emails") {
          return SQLTable.sqlQuery(null, campaign.query, [], (err, data) => {
            if (err || !data) return Page.renderNotFound(req, res);
            let emails = ["email"];
            data.rows.forEach((row) => {
              emails.push(row.email);
            });
            res.end(emails.join("\r"));
          });
        }

        // if a campaign specified but no view
        return Page.renderNotFound(req, res);
      });
    }

    EmailCampaign.getAll({}, (err, campaigns) => {
      Page.render(req, res, EmailCampaigns, {campaigns});
    });
  }
}

module.exports = EmailCampaign;
