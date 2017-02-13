

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const async = require('async');

const SQLTable = require('./SQLTable');
const Store = require('./Store.js');
const User = require('./User.js');

const LayoutMain = require('../views/LayoutMain.jsx');

const ProductList = require('../views/ProductList.jsx');
const ItemProductionChecklist = require('../views/ItemProductionChecklist.jsx');
const ItemProductionChecklistLegacy = require('../views/ItemProductionChecklistLegacy.jsx');
const NotFound = require('../views/NotFound.jsx');

// these are the models the page query will have access to
const whitelisted_models = {
  "Store": Store,
  "User": User
}
// these are the react components the page query will have access to
const whitelisted_components = {
  "ProductList": ProductList,
  "ItemProductionChecklist": ItemProductionChecklist,
  "ItemProductionChecklistLegacy": ItemProductionChecklistLegacy,
}

class Page extends SQLTable {
  constructor(page) {
    super();
    this.path = page.path;
    this.elements = page.elements;
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "pages",
      pkey: "path",
      fields: ["elements"]
    };
  }

  // if we have a matching path in our pages table, serve that page
  static handleHTTP(req, res, next) {
    let self = this;

    let pages = Page.getAll(null, function(err, pages) {
      for (let i=0; i<pages.length; i++) {
        let matches = req.path.match(pages[i].path);
        if (matches) {
          // TODO go through all elements and do this
          let element = pages[i].elements[0];

          // there are 2 ways of specifying prop data, immediate or from db
          let immediate = req.query; // can also be supplied from querystring
          let queries = [];
          for (let prop in element.props) {
            // if the prop was not in model-query form, just copy it
            if (!element.props[prop].model || !element.props[prop].query) {
              immediate[prop] = element.props[prop];
              continue;
            }
            // otherwise try the db fetch
            let model = whitelisted_models[element.props[prop].model];
            if (!model) return res.status(500).end("Page Error: model not whitelisted");
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
            let component = whitelisted_components[element.type]
            if (!component) return res.status(500).json({error:"page component not whitelisted"});
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

  static renderNotFound(req, res) {
    // if json was requested, just return the props object
    if (!req.accepts('*/*') && req.accepts('application/json'))
      return res.status(404).json({error:"Not Found"}).end();
    let page = React.createElement(NotFound, {});
    return res.status(404).end(ReactDOMServer.renderToString(page));
  }

  static render(req, res, component, props, layout=LayoutMain) {
    // if json was requested, just return the props object
    if (!req.accepts('*/*') && req.accepts('application/json'))
      return res.json(props).end();
    return res.end(Page.renderString(component, props, layout));
  }
}

module.exports = Page;
