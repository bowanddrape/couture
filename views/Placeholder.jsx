
const React = require('react');
const Stroke = require('./Stroke.jsx');

class Placeholder extends React.Component {

  render() {
    return (
      React.createElement("content", {},
        React.createElement(Stroke, {data:"/logo_stroke.svg", style:{display:"block",width:"600px",maxWidth:"100%"}, draw_on_load: true}),
      )
    );
  }

}

module.exports = Placeholder;
