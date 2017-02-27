
const React = require('react');
class ProductCanvas extends React.Component {
  render() {
console.log(this.props);
    return (
      <canvas width="500px" height="600px" style={{backgroundImage:`url(${this.props.props.image})`}} />
    );
  }
}

module.exports = ProductCanvas;
