
const SQLTable = require('./SQLTable');
const Page = require('./Page');

class JSONAPI extends SQLTable {

  handleHTTP(req, res, next) {
    if (req.path_tokens[0]!=this.constructor.name.toLowerCase()) {
      return next();
    }

    // user must be an admin
    if (!req.user || req.user.roles.indexOf("bowanddrape")==-1) {
      return Page.renderNotFound(req, res);
    }

    if (req.method=='GET') {
      if (!req.query.page) {
        req.query.page = "{}";
      }
      req.query.page = JSON.parse(req.query.page);
      // restrict how many entries we return
      if (!req.query.page.limit || req.query.page.limit>20)
        req.query.page.limit = 20;
      return this.constructor.getAll(req.query, (err, shipments) => {
        res.json(shipments).end();
      });
    }
    if (req.method=='POST') {
      let object = new this.constructor(req.body);
      return object.upsert((err, result) => {
        if (err)
          return res.json({error: err});
        return res.json(object);
      });
    }
    res.json({error: "invalid endpoint"}).end();
  }
}

module.exports = JSONAPI;
