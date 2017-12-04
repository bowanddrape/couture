
const React = require('react');

/***
Helper component for displaying prices
***/
class Price extends React.Component {
  render() {
    let style = {color: "#000"};
    let price = this.props.price;
    if (!isNaN(parseFloat(this.props.price))) {
      if (this.props.total) {
        let quantity = this.props.quantity || 1;
        price *= quantity;
      }
      price = parseFloat(this.props.price);
      if (price < 0) {
        style.color = "#d6492a";
        price = "-$"+Math.abs(price).toFixed(2);
      } else if (price == 0) {
        style.opacity = "0.5";
        price = "$"+price.toFixed(2);
      } else {
        price = "$"+price.toFixed(2);
      }
    }
    style = Object.assign({}, this.props.style, style);

    return (
      <div style={style} className="price">
        <span style={style.price}>{price}</span>
        {this.props.quantity&&!this.props.total?` x ${this.props.quantity}`:null}
      </div>
    );
  }
}
module.exports = Price;
