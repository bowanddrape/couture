
const React = require('react');
const Stroke = require('./Stroke.jsx');

/***
If something is not yet designed but you want to draw something there
***/
class Placeholder extends React.Component {

  handleClick() {
    this.refs.logo.setVisible(false);
    setTimeout(()=>{
      this.refs.logo.setVisible(true);
    }, 20);
  }

  render() {
    return (
      React.createElement("content", {onClick: this.handleClick.bind(this)},
        React.createElement(Stroke, {data:"/logo_stroke.svg", style:{display:"block",width:"600px",maxWidth:"100%",pointerEvents:"none"}, draw_on_load: true, ref: "logo"}),
      )
    );
  }

}

module.exports = Placeholder;
