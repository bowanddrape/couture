
const React = require('react');

/***
Helper component for displaying prices
***/
class Price extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      editing_quantity: false,
    };
  }
  render() {
    let style = {color: "#000"};
    let price = this.props.price;
    if (!isNaN(parseFloat(this.props.price))) {
      price = parseFloat(this.props.price);
      if (this.props.total) {
        let quantity = this.props.quantity || 1;
        price *= quantity;
      }
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

    let quantity = null;
    if (this.props.quantity&&!this.props.total) {
      quantity = ` x ${this.props.quantity}`;
      if (this.props.quantity_editable) {
        quantity = <span className="edit_quantity">
          x
          <input type="text"
            onFocus={() => {
              this.setState({editing_quantity:true});
            }}
            onBlur={(event) => {
              let element = event.target;
              setTimeout(()=>{
                this.setState({editing_quantity:false});
                element.value="";
              }, 500);
            }}
            placeholder={this.props.quantity}
          />
          <button
            style={{display:this.state.editing_quantity?"inline-block":"none"}}
            onClick={(event) => {
              let quantity = event.target.previousSibling.value;
              quantity = parseInt(quantity.trim());
              if (isNaN(quantity) || quantity<=0) return;
              this.props.onUpdateQuantity(quantity);
            }}
          >apply</button>
        </span>
      }
    }

    return (
      <div style={style} className="price">
        <span style={style.price}>{price}</span>
        {quantity}
      </div>
    );
  }
}
module.exports = Price;
