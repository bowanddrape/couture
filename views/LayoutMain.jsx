
const React = require('react');
const ReactDOMServer = require('react-dom/server');

const LayoutBorderWrap = require('./LayoutBorderWrap.jsx');
const LayoutHeader = require('./LayoutHeader.jsx');
const LayoutFooter = require('./LayoutFooter.jsx');


/***
The most common of layout. Renders a react component

renders any react component but also the menu and any header elements
props:
  content: [
    {
      name:"" // react component
      props:{} // properties for react component
    }
  ]
  content_string:"" // page as server-side rendered string
***/
class LayoutMain extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {},
    };
  }

  componentDidMount() {
    BowAndDrape.dispatcher.on("user", (user) => {
      this.setState({user, user});
    });

    // bind resize
    window.addEventListener("resize", () => {BowAndDrape.dispatcher.emit("resize");});

    BowAndDrape.dispatcher.emit("loaded");
    window.addEventListener("load", () => {
      BowAndDrape.dispatcher.emit("resize");
    });
  }

  render() {
    let content = null;

    if (typeof(document)=='undefined') {
      content = (<div dangerouslySetInnerHTML={{__html:unescape(this.props.content_string)}} />);
    } else {
      content = [];
      let props_contents = this.props.content;
      let static_server_render = false;
      if (typeof(props_contents)=='string')
        props_contents = JSON.parse(props_contents);
      for (let i=0; i<props_contents.length; i++) {
        // if we didn't get a client-side component, use the server-side render
        if (!BowAndDrape.views[props_contents[i].name]) {
          content = (<div dangerouslySetInnerHTML={{__html:unescape(this.props.content_string)}} />);
          break;
        }
        let props = props_contents[i].props;
        props.key = content.length;
        content.push(React.createElement(
          BowAndDrape.views[props_contents[i].name],
          props
        ));
      };
    }

    let zoom = 1;
    if (typeof(document)!="undefined")
      zoom = document.body.clientWidth / window.innerWidth;
    return (
      <div className="layout">
        <link rel="stylesheet" href="/styles.css" type="text/css"></link>
        <LayoutBorderWrap />
        <LayoutHeader user={this.state.user}/>
        {content}
        <LayoutFooter user={this.state.user}/>

        <script src="/BowAndDrape.js"></script>
        <script src="/masonry.pkgd.min.js"></script>

        <script dangerouslySetInnerHTML={{__html:`

          var BowAndDrape = require("BowAndDrape");
          var React = BowAndDrape.React;
          var ReactDOM = BowAndDrape.ReactDOM;
          var content = \`${JSON.stringify(this.props.content)}\`;
          if (content != "undefined") {
            content = content.replace(/\\n/g, "");
            var layout = React.createElement(BowAndDrape.views.LayoutMain, {
              content_string: \`${escape(this.props.content_string)}\`,
              content,
            });
            ReactDOM.render(
              layout,
              document.querySelector(".layout")
            );
          }
        `}} >
        </script>

      </div>
    )
  }
}

module.exports = LayoutMain;
