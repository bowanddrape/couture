
const SQLTable = require('./SQLTable');
const Page = require('./Page');

class JSONAPI extends SQLTable {

  handleHTTP(req, res, next) {
    // ignore if not a json request
    if (req.accepts('*/*') || !req.accepts('application/json'))
      return next();

    // ignore if not for us
    if (req.path_tokens[0]!=this.constructor.name.toLowerCase())
      return next();

    // user must be an admin
    if (!req.user || req.user.roles.indexOf("bowanddrape")==-1)
      return Page.renderNotFound(req, res);

    if (req.method=='GET') {
      if (!req.query.page) {
        req.query.page = "{}";
      }
      req.query.page = JSON.parse(req.query.page);
      // restrict how many entries we return
      if (!req.query.page.limit || req.query.page.limit>20)
        req.query.page.limit = 20;
      return this.constructor.getAll(req.query, (err, objects) => {
        res.json(objects).end();
      });
    }
    if (req.method=='POST') {
      let object = new this.constructor(req.body);
      return this.onApiSave(res, req, object);
    }
    if (req.method=='DELETE') {
      let object = new this.constructor(req.body);
      return this.onApiRemove(res, req, object);
    }
    res.json({error: "invalid endpoint"}).end();
  }

  onApiSave(res, req, object, callback) {
    object.upsert((err, result) => {
      if (callback)
        return (callback(err, result));
      if (err)
        return res.json({error: err});
      return res.json(object);
    });
  }

  onApiRemove(res, req, object, callback) {
    object.remove((err, result) => {
      if (callback)
        return (callback(err, result));
      if (err)
        return res.json({error: err});
      return res.json(object);
    });
  }
}

module.exports = JSONAPI;
