
const React = require('react');

/***
The most minimalist of layouts

renders any react component and that's it
props:
  content_name:"" // react component
  content_props:{} // properties for react component
  content_string:"" // page as server-side rendered string
***/
class LayoutBasic extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    BowAndDrape.dispatcher.emit("loaded");
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

    return (
      <div>
        <link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet"/>
        <link rel="stylesheet" href="/styles.css" type="text/css"></link>
        {content}

        <script src="/BowAndDrape.js"></script>
        <script src="/masonry.pkgd.min.js"></script>

        <script dangerouslySetInnerHTML={{__html:`

          var BowAndDrape = require("BowAndDrape");
          var React = BowAndDrape.React;
          var ReactDOM = BowAndDrape.ReactDOM;
          var content = \`${JSON.stringify(this.props.content)}\`;
          if (content != "undefined") {
            content = content.replace(/\\n/g, "");
            var layout = React.createElement(BowAndDrape.views.LayoutBasic, {
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

module.exports = LayoutBasic;
