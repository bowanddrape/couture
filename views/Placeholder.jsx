
const React = require('react');

class Placeholder extends React.Component {

  render() {
    return (
      React.createElement("content", {},
        React.createElement("img", {src:"/logo.svg"}),
        React.createElement("placeholder_content", {},
          React.createElement("img", {src:"/placeholder.png"})
        )
      )
    );
  }

}

module.exports = Placeholder;
