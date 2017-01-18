
const React = require('react');

class LayoutBasic extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let content = null;

    if (typeof(document)=='undefined' || typeof(BowAndDrape.views[this.props.content_name])=='undefined') {
      content = (<div dangerouslySetInnerHTML={{__html:this.props.content_string}} />);
    } else {
      content = React.createElement(
        BowAndDrape.views[this.props.content_name],
        JSON.parse(this.props.content_props)
      );
    }

    return (
      <div>
        <meta httpEquiv="content-type" content="text/html; charset=utf-8" />
        <link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet"/> 
        <link rel="stylesheet" href="/styles.css" type="text/css"></link>
        {content}
        <script src="/BowAndDrape.js"></script>

        <script dangerouslySetInnerHTML={{__html:`
          var BowAndDrape = require("BowAndDrape");
          var React = BowAndDrape.React;
          var ReactDOM = BowAndDrape.ReactDOM;
          var layout = React.createElement(BowAndDrape.views.LayoutBasic, {
            content_string: \`${this.props.content_string}\`,
            content_name: \`${this.props.content_name}\`,
            content_props: \`${this.props.content_props}\`}
          );
          ReactDOM.render(
            layout,
            document.body
          );
        `}} >
        </script>

      </div>
    )
  }
}

module.exports = LayoutBasic;
