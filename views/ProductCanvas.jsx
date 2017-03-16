
const React = require('react');
class ProductCanvas extends React.Component {
  render() {
console.log(this.props);
    return (
      <canvas width="200px" height="300px" style={{backgroundImage:`url(${this.props.props.image})`,position:"relative"}}>
      </canvas>
    );
  }
}

module.exports = ProductCanvas;
