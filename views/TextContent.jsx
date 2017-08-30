
const React = require('react');

/***
Display text content
***/
class TextContent extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div dangerouslySetInnerHTML={{
        __html:unescape(this.props.content_string)
      }} />
    );
  }

}

module.exports = TextContent;
