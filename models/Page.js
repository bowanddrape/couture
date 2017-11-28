

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const async = require('async');
const sharp = require('sharp');

const JSONAPI = require('./JSONAPI');

const LayoutMain = require('../views/LayoutMain.jsx');
const LayoutBasic = require('../views/LayoutBasic.jsx');

const NotFound = require('../views/NotFound.jsx');
const HTMLConvert = require('html-convert')({width: 600, height: 800});

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
  "Gallery",
  "Signup",
  "TextContent",
  "WarningNotice",
  "Carousel",
  "HeroProduct",
]

/*
 *Responsible for drawing pages
 *
 * Upon a request, checks the db for a matching path. Then retrieves
 * the "elements" field from db. The elements will be a list of react
 * components and props.
 *
 * Props in the format {model:"",query:{}} will have the corresponding
 * SQLTable.get() call. If the react component class has a
 * preprocessProps() defined, that gets called server-side here. The
 * react components then get rendered as the response.
 */

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
      fields: ["elements", "title", "description", "redirect"],
    };
  }

  // extends JSONAPI
  handleHTTPPage(req, res, next) {
    // user must be an admin
    if (!req.user || req.user.roles.indexOf("bowanddrape")==-1)
      return Page.renderNotFound(req, res);
    // if path is specified
    if (req.path_tokens.length > 1) {
      let path = `/${req.path_tokens.slice(1).join('/')}`;
      // special handling for homepage link
      if (path=="/%20") path = "/";
      return Page.get(path, (err, page) => {
        // Check for error and missing page
        if (err) return res.status(500).json(err);
        if (!page) return Page.renderNotFound(req, res);
        // Render widget for managing admin CMS pages
        Page.render(req, res, require(`../views/PageEdit.jsx`), {
          whitelisted_models,
          whitelisted_components,
          path: page.path,
          title: page.title,
          description: page.description,
          redirect: page.redirect,
          elements: page.elements,
        });
      });
    }

    Page.render(req, res, require(`../views/PageList.jsx`), {whitelisted_models, whitelisted_components});
  }

  // if we have a matching path in our pages table, serve that page
  static handleRenderPage(req, res, next) {
    let pages = Page.getAll(null, function(err, pages) {
      for (let i=0; i<pages.length; i++) {
        let matches = req.path.match(new RegExp("^"+pages[i].path.replace(/\+/g,'\\+')+"$", "i"));
        if (!matches) continue;
        // Check for redirect
        if (pages[i].redirect)
          return res.redirect(pages[i].redirect);
        return pages[i].render(req, res);
      } // for pages
      next();
    }); // page.getAll()
  }

  render(req, res){
    let render_elements = [];
    this.elements.forEach((element) => {
      if (!element || !element.type) return;
      render_elements.push(function(callback) {

        // there are 2 ways of specifying prop data, immediate or from db
        let immediate = {};
        // can also be supplied from querystring?
        for (let key in req.query) {
          try {
            // parse it if it's json
            immediate[key] = JSON.parse(req.query[key]);
          } catch(err) {
            // otherwise strip quotes as they mess with JSON format
            if (typeof(req.query[key])=='string')
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
            return callback("Page Error: model not whitelisted");
          let model = require(`./${element.props[prop].model}.js`);
          let query = element.props[prop].query;
          queries.push(function(callback) {
            model.getAll(query, function(err, data) {
              callback(err, {prop:prop, data:data});
            });
          });
        }

        return async.parallel(queries, function(err, data) {
          if (err) return callback("Data Error: could not fetch from database");

          // convert db data array to prop object for the react component
          let props = {};
          data.map(function(query_result) {
            props[query_result.prop] = query_result.data;
          });
          // copy over immediate props
          Object.assign(props, immediate);

          // render react component
          if (whitelisted_components.indexOf(element.type)==-1)
            return callback({error:"page component not whitelisted"});
          let component = require(`../views/${element.type}.jsx`);
          // have a place for optional async preprocessing?
          if (component.preprocessProps) {
            return component.preprocessProps(props, function(err, result) {
              if (err) {
                console.log("Page::render preprocessProps "+err); //TODO elevate this
                return callback(err);
              }
              return callback(null, {component, props:result});
            });
          }
          return callback(null, {component, props});
        });
      }); // setup render_elements

    }); //go through all elements on page
    return async.parallel(render_elements, (err, data) => {
      if(err) return res.status(500).end(JSON.stringify(err));
      let head_props = {};
      if (data.length)
        head_props = data[0].props;
      if (this.title)
        head_props.title = this.title;
      if (this.description)
        head_props.description = this.description;
      let head = Page.getHTMLHead(req, res, head_props);
      let layout = Page.getLayout(req, res);
      if (!layout) return;
      let body = Page.renderString(data, layout);
      return res.end(`<head>${head}</head><body><div class="layout">${body}</div></body>`);
    });
  }

  static renderString(component_list, layout) {
    // render the page server-side
    let content_string = "";
    let content = [];
    component_list.forEach((comp_props) => {
      let react_element = React.createElement(comp_props.component, comp_props.props);
      content_string += ReactDOMServer.renderToString(react_element);
      content.push({
        name: react_element.type.name.toString(),
        props: comp_props.props,
      });
    });
    let page = React.createElement(layout, {content_string, content});

    return ReactDOMServer.renderToString(page);
  }

  // TODO render function for 5XX errors
  static renderError(req, res) {
    res.status(500);
    Page.render(req, res, NotFound, {error:"Server Error"});
  }

  // helper function to render 404
  static renderNotFound(req, res) {
    res.status(404);
    Page.get('/', (err, page) => {
      if (!page){
        // render the 404 warning
        // ex: Page.renderString([{component, props:Object.assign({}, req.query, props)}], layout);
        // ex: let body = Page.renderString(data, req.query.embed?LayoutBasic:LayoutMain);
        //   static renderString(component_list, layout)
        return res.end("Error: No page");
      }
      page.elements.unshift({type: "WarningNotice", props: {message: "OOPS! Page Not Found"}});
      page.render(req, res);
    });
  }

  // helper functions to get <head> stuff, usually used to popoulate meta tags
  static getHTMLHead(req, res, props) {
    let image_header = "";
    if (props.c && props.store) {
      let width = 256;
      let height = 256;
      image_header = `<meta property="og:image:width" content="${width}"/><meta property="og:image:height" content="${height}"/><meta property="og:image" content="https://${req.headers.host}/store/${props.store.id}/preview?w=${width}&h=${height}&c=${encodeURIComponent(props.c)}"/>`
    }

    let title = props.title || "Bow&Drape"+req.path.replace(/\//g, " ");
    let description_header = "";
    if (props.description)
      description_header = `<meta name="description" content="${props.description}"/>`;

    return `
      <meta httpEquiv="content-type" content="text/html; charset=utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <title>${title}</title>
      ${description_header}
      <meta property="og:title" content="${title}"/>
      <meta property="og:type" content="website"/>
      ${image_header}

      <script defer src="//plugin.headlinerlabs.com/users/bowanddrape.js"></script>

      <meta name="google-site-verification" content="cYV8ia9c-3X6qd6qznEX4-VLO8F35cVSiH7q2usl1Is" />
      <!-- Global Site Tag (gtag.js) - Google Analytics -->
      <script async src="https://www.googletagmanager.com/gtag/js?id=UA-52623236-1"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments)};
        gtag('js', new Date());
        gtag('config', 'UA-52623236-1');
        gtag('event', 'page_view');
      </script>
      <!-- End Google Analytics -->

      <!-- Facebook Pixel Code -->
      <script>
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq.disablePushState = true;
        fbq('init', '1694467677446831');
        fbq('track', 'PageView');
      </script>
      <noscript><img height="1" width="1" style="display:none"
        src="https://www.facebook.com/tr?id=1694467677446831&ev=PageView&noscript=1"
      /></noscript>
      <!-- End Facebook Pixel Code -->
    `;
  }

  static getLayout(req, res) {
    let layout = LayoutMain;

    // allow query to override layout
    if (req.query.embed)
      layout = "basic";
    if (req.query.layout)
      layout = req.query.layout;

    switch (layout) {
      case "basic":
        layout = LayoutBasic;
        break;
      case "image":
        try {
          // I thought req.protocol would work, but we need to specify https
          HTMLConvert(`${process.env.ENV=='dev'?'http':'https'}://${req.headers.host}${req.path}?layout=basic&token=${req.query.token}`).pipe(sharp().trim()).pipe(res);
        } catch(err) {
          console.log(`error rendering image ${req.headers.host}${req.path}?layout=basic&token=${req.query.token} ${err.toString()}`);
          return Page.renderError(req, res);
        }
        return;
      case "main":
      default:
        layout = LayoutMain;
        break;
    }
    return layout;
  }

  // respond to a req by rendering page contents
  static render(req, res, component, props) {
    // if json was requested, just return the props object
    if (!req.accepts('*/*') && req.accepts('application/json'))
      return res.json(props).end();
    let head = Page.getHTMLHead(req, res, props);
    let layout = Page.getLayout(req, res);
    if (!layout) return;
    let body = Page.renderString([{component, props:Object.assign({}, req.query, props)}], layout);
    return res.end(`<head>${head}</head><body><div class="layout">${body}</div></body>`);
  }

}

module.exports = Page;
