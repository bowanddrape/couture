
const React = require('react');

/***
The most minimalist of layouts

renders any react component and that's it
props:
  content: [
    {
      name:"" // react component
      props:{} // properties for react component
    }
  ]
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
    let content = [];
    let props_contents = this.props.content;
    let static_server_render = false;
    if (typeof(props_contents)=='string') {
      props_contents = props_contents.replace(/\n/g, "\\n");
      props_contents = JSON.parse(props_contents);
    }
    for (let i=0; i<props_contents.length; i++) {
      let props = props_contents[i].props;
      props.key = content.length;
      let component = null;
      if (typeof(document)=='undefined')
        component = require("../views/"+props_contents[i].name+".jsx");
      else
        component = BowAndDrape.views[props_contents[i].name];
      content.push(React.createElement(
        component,
        props
      ));
    };

    let zoom = 1;
    if (typeof(document)!="undefined")
      zoom = document.body.clientWidth / window.innerWidth;
    return (
      <div>
        <link rel="stylesheet" href="/styles.css" type="text/css"></link>
        {content}

        <script src="/BowAndDrape.js"></script>
        <script src="/masonry.pkgd.min.js"></script>

        <script dangerouslySetInnerHTML={{__html:`
          var BowAndDrape = require("BowAndDrape");
          var React = BowAndDrape.React;
          var ReactDOM = BowAndDrape.ReactDOM;
          var content = ${JSON.stringify(this.props.content)};
          if (content != "undefined") {
            var layout = React.createElement(BowAndDrape.views.LayoutBasic, {
              content_string: \`${(typeof(document)!="undefined")?this.props.content_string:escape(this.props.content_string)}\`,
              content,
            });
            ReactDOM.hydrate(
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
