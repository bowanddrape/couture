

const React = require('react');
const Stroke = require('./Stroke.jsx');

const override_option_order = [
  "XXS","XS","S","M","L","XL","XXL","XXXL",
  "The Boyfriend Sweatshirt","The Oversized Hoodie","The Short Sleeve Sweatshirt","The Vintage Tee","The Grandpa Cardigan","The Denim Jacket","The Bomber Jacket","The Utility Jacket", "The Bonnie Slip Dress", "The Cami", "The Tank Top", "The Tote", "The Backpack", "The Crossbody Bag", "The Flat Pouch", "The Mini Pouch", "The Dad Hat", "The Confetti Beanie", "The Pom Pillow", "The Pet Sweatshirt", "The Airbrush Hoodie", "The Airbrush Denim Jacket", "The Airbrush Utility Jacket", "The Airbrush Oversized Tee", "The Airbrush Flat Pouch",
];

/***
This is the product switcher at the bottom
***/
class BottomSwitch extends React.Component {
  constructor(props) {
    super(props);

    let product_map = {};
    this.props.store.products.forEach((product) => {
      product_map[product.sku] = product;
    });

    this.state = {
      expanded: false,
    }
  }

  render() {
    let options = [];
    let children = React.Children.toArray(this.props.children);
    // potentially override option order
    children.sort((a,b) => {
      let a_order_override = override_option_order.indexOf(a.props.children);
      let b_order_override = override_option_order.indexOf(b.props.children);
      if (a_order_override != b_order_override)
        return a_order_override - b_order_override;
      return a.props.value - b.props.value;
    });
    for (let index=0; index<children.length; index++) {
      let child = children[index];
      if (child.type!="option") continue;
      if (!child.props.children) continue;
      options.push(
        <switch_option className={child.props.value==this.props.value?"selected":""} ref={index} key={index} {...child.props} onClick={
          ()=>{this.props.onChange(child.props.value)}
        }>
          <div style={{textAlign:"center"}}>
          <p>{child.props.children}</p>
          </div>
        </switch_option>
      );
    }
    return (
      <BottomSwitch
        className={this.state.expanded||this.props.always_expanded?"expanded":null}
        onClick={()=>{this.setState({expanded:!this.state.expanded})}}
        style={this.props.style}
      >
        {options}
      </BottomSwitch>
    )
  }
}

module.exports = BottomSwitch;
