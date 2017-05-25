

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const async = require('async');

const JSONAPI = require('./JSONAPI');

const LayoutMain = require('../views/LayoutMain.jsx');

const NotFound = require('../views/NotFound.jsx');

// these are the models the page query will have access to
const whitelisted_models = [
  "Store",
  "User"
]
// these are the react components the page query will have access to
const whitelisted_components = [
  "ProductList",
  "ItemProductionChecklist",
  "ItemProductionChecklistLegacy",
  "Cart",
]

/***
Responsible for drawing pages

upon a request, checks the db for a matching path. Then retrieves the "elements" field from db. The elements will be a list of react components and props. Props in the format {model:"",query:{}} will have the corresponding SQLTable.get() call. If the react component class has a preprocessProps() defined, that gets called server-side here. The react components then get rendered as the response
***/
class Page extends JSONAPI {
  constructor(page) {
    super();
    Object.assign(this, page);
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "pages",
      pkey: "path",
      fields: ["elements"]
    };
  }

  // extends JSONAPI
  handleHTTPPage(req, res, next) {
    // user must be an admin
    if (!req.user || req.user.roles.indexOf("bowanddrape")==-1)
      return Page.renderNotFound(req, res);

    Page.render(req, res, require(`../views/PageList.jsx`), {whitelisted_models, whitelisted_components});
  }

  // if we have a matching path in our pages table, serve that page
  static handleRenderPage(req, res, next) {
    let pages = Page.getAll(null, function(err, pages) {
      for (let i=0; i<pages.length; i++) {
        let matches = req.path.match(pages[i].path);
        if (matches) {
          // TODO go through all elements and do this
          let element = pages[i].elements[0];
          if (!element) continue;

          // there are 2 ways of specifying prop data, immediate or from db
          let immediate = {};
          // can also be supplied from querystring?
          for (let key in req.query) {
            try {
              // parse it if it's json
              immediate[key] = JSON.parse(req.query[key]);
            } catch(err) {
              // otherwise strip quotes as they mess with JSON format
              immediate[key] = req.query[key].replace(/"/g, '');
            }
          }
          let queries = [];
          for (let prop in element.props) {
            // if the prop was not in model-query form, just copy it
            if (!element.props[prop].model || !element.props[prop].query) {
              immediate[prop] = element.props[prop];
              continue;
            }
            // otherwise try the db fetch
            if (whitelisted_models.indexOf(element.props[prop].model)==-1)
              return res.status(500).end("Page Error: model not whitelisted");
            let model = require(`./${element.props[prop].model}.js`);
            let query = element.props[prop].query;
            queries.push(function(callback) {
              model.getAll(query, function(err, data) {
                callback(err, {prop:prop, data:data});
              });
            });
          }

          return async.parallel(queries, function(err, data) {
            if (err) return res.status(500).end("Data Error: could not fetch from database");

            // convert db data array to prop object for the react component
            let props = {};
            data.map(function(query_result) {
              props[query_result.prop] = query_result.data;
            });
            // copy over immediate props
            Object.assign(props, immediate);

            // render react component
            if (whitelisted_components.indexOf(element.type)==-1)
              return res.status(500).json({error:"page component not whitelisted"});
            let component = require(`../views/${element.type}.jsx`);
            // have a place for optional async preprocessing?
            if (component.preprocessProps) {
              return component.preprocessProps(props, function(err, result) {
                if (err) {
                  console.log(err); //TODO elevate this
                  return res.status(500).json({error:err.toString()});
                }
                Page.render(req, res, component, result);
              });
            }
            Page.render(req, res, component, props);
          });
        } 
      }
      next();
    });
  }

  static renderString(component, props, layout) {
    // render the page server-side
    let content = React.createElement(component, props);
    let page = React.createElement(layout, {content_string:ReactDOMServer.renderToString(content), content_name:content.type.name.toString(), content_props: JSON.stringify(props)});

    return ReactDOMServer.renderToString(page);
  }

  // TODO render function for 5XX errors

  // helper function to render 404
  static renderNotFound(req, res) {
    if (!req.accepts('*/*') && req.accepts('application/json'))
      return res.status(404).json({error:"Not Found"}).end();
    let page = React.createElement(NotFound, {});
    return res.status(404).end(ReactDOMServer.renderToString(page));
  }

  // helper functions to get <head> stuff, usually used to popoulate meta tags
  static getHTMLHead(req, res, props) {
    let image_header = "";
    if (props.c && props.store) {
      let width = 256;
      let height = 256;
      image_header = `<meta property="og:image:width" content="${width}"/><meta property="og:image:height" content="${height}"/><meta property="og:image" content="https://${req.headers.host}/store/${props.store.id}/preview?w=${width}&h=${height}&c=${encodeURIComponent(props.c)}"/>`
    }
    return `
      <meta httpEquiv="content-type" content="text/html; charset=utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <meta property="og:title" content="Bow & Drape"/>
      <meta property="og:type" content="website"/>
      ${image_header}
    `;
  }

  // respond to a req by rendering page contents
  static render(req, res, component, props, layout=LayoutMain) {
    // if json was requested, just return the props object
    if (!req.accepts('*/*') && req.accepts('application/json'))
      return res.json(props).end();
    let head = Page.getHTMLHead(req, res, props);
    let body = Page.renderString(component, props, layout);
    return res.end(`<head>${head}</head><body>${body}</body>`);
  }

}

module.exports = Page;
