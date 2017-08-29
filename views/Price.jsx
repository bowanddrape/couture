
const React = require('react');

/***
Helper component for displaying prices
***/
class Price extends React.Component {
  render() {
    let price = parseFloat(this.props.price);
    let style = {color: "#000"};
    if (price < 0)
      style.color = "#d6492a";
    if (price == 0)
      style.opacity = "0.5";
    style = Object.assign({}, this.props.style, style);

    return (
      <div style={style}>
        {price?`$${price.toFixed(2)}`:`Free!`}
        {this.props.quantity?` x ${this.props.quantity}`:null}
      </div>
    );
  }
}
module.exports = Price;
