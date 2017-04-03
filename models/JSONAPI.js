
const SQLTable = require('./SQLTable');

class JSONAPI extends SQLTable {

  handleHTTP(req, res, next) {
    // ignore if not for us
    if (req.path_tokens[0]!=this.constructor.name.toLowerCase())
      return next();

    // if not a json request, see if we handle that
    if (req.accepts('*/*') || !req.accepts('application/json'))
      return this.handleHTTPPage(req, res, next);

    if (!this.hasApiPermission(req, res))
      return res.status(404).json({error:"Not Found"}).end();

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
      return this.onApiSave(req, res, object);
    }
    if (req.method=='DELETE') {
      let object = new this.constructor(req.body);
      return this.onApiRemove(req, res, object);
    }
    res.status(404).json({error: "invalid endpoint"}).end();
  }

  handleHTTPPage(req, res, next) {
    // by default ignore non-json requests
    next();
  }

  hasApiPermission(req, res) {
    // user must be an admin
    return (req.user && req.user.roles.indexOf("bowanddrape")!=-1);
  }

  onApiSave(req, res, object, callback) {
    // default action is just to save
    object.upsert((err, result) => {
      if (callback)
        return (callback(err, result));
      if (err)
        return res.json({error: err});
      return res.json(object);
    });
  }

  onApiRemove(req, res, object, callback) {
    // default action is just to remove
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
