
const SQLTable = require('./SQLTable');
const Item = require('./Item');
const Page = require('./Page');

class Shipment extends SQLTable {
  constructor(shipment) {
    super();
    Object.assign(this, shipment);
    if (this.contents)
      this.contents = new Item(this.contents);
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "shipments",
      pkey: "id",
      fields: ["from_id", "to_id", "order_id", "contents", "requested", "packed", "received", "tracking_code"]
    };
  }

  static handleHTTP(req, res, next) {
    req.path_tokens = req.url.split('?')[0].split('/').slice(1);

    if (req.path_tokens[0]!='shipment') {
      return next();
    }

    // user must be logged in
    if (!req.user) {
      return Page.renderNotFound(req, res);
    }

    if (req.method=='GET') {
      if (req.query.page) {
        req.query.page = JSON.parse(req.query.page);
        if (!req.query.page.limit || req.query.page.limit>20)
          req.query.page.limit = 20;
      }
      return Shipment.getAll(req.query, (err, shipments) => {
        res.json(shipments).end();
      });
    }
    if (req.method=='POST') {
    }
    res.json({error: "invalid endpoint"}).end();
  }
}

module.exports = Shipment;
