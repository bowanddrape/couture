
const SQLTable = require('./SQLTable');

/***
Have any model you want connected to the API inherit this, then call handleHTTP
in your server.js as middleware for express
Has a bunch of default function definitions that can be overwritten
***/
class JSONAPI extends SQLTable {

  handleHTTP(req, res, next) {
    // ignore if not for us
    if (req.path_tokens[0]!=this.constructor.name.toLowerCase())
      return next();

    if (!this.hasApiPermission(req, res))
      return res.status(404).json({error:"Not Found"}).end();

    // if not a json request, see if we handle that
    if (req.accepts('*/*') || !req.accepts('application/json'))
      return this.handleHTTPPage(req, res, next);

    if (req.method=='GET') {
      if (!req.query.page) {
        req.query.page = "{}";
      }
      req.query.page = JSON.parse(req.query.page);
      // restrict how many entries we return
      if (!req.query.page.limit)
        req.query.page.limit = 20;
      if (req.query.page.limit>100)
        req.query.page.limit = 100;
      return this.constructor.getAll(req.query, (err, objects) => {
        res.json(objects).end();
      });
    }
    if (req.method=='POST') {
      // convert any parsable json field
      for(let field in req.body) {
        // but skip strings that are numbers!
        if (!isNaN(parseFloat(req.body[field])))
          continue;
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch(err) {}
      }
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
    // by default user must be a super-admin
    return (req.user && req.user.roles.indexOf("bowanddrape")!=-1);
  }

  onApiSave(req, res, object, callback) {
    // by default action is just to save
    object.upsert((err, result) => {
      if (callback)
        return (callback(err, result));
      if (err)
        return res.json({error: err});
      return res.json(object);
    });
  }

  onApiRemove(req, res, object, callback) {
    // by default action is just to remove
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
