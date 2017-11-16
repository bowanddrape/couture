
const React = require('react');

/***
Display a single product
***/
class HeroProduct extends React.Component {
  static preprocessProps(options, callback) {
console.log("hero preprocess", options);
    return callback(null, options);
  }

  render() {
    return "hiyo";
  }
}
module.exports = HeroProduct;
