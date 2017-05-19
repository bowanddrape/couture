
const React = require('react');
const Stroke = require('./Stroke.jsx');

class Placeholder extends React.Component {

  render() {
    return (
      React.createElement("content", {},
        React.createElement(Stroke, {src:"/logo_stroke.svg", style:{display:"block",width:"600px",maxWidth:"100%"}}),
      )
    );
  }

}

module.exports = Placeholder;
