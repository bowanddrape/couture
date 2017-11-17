
const React = require('react');
const Switch = require('./Switch.jsx');
const BADButton = require('./BADButton.jsx');

/***
Display a single product
***/
class HeroProduct extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selected_option: 0,
    };
  }

  static preprocessProps(options, callback) {
    return callback(null, options);
  }

  handleAddToCart(event) {
    let sku = this.props.base_sku;
    let options = [this.props.base_sku];
    if (typeof(this.props.options[this.state.selected_option])!="undefined") {
      let option_name = this.props.options[this.state.selected_option].name;
      sku += `_${option_name}`;
      options.push(option_name);
    }

    // build cart item
    let item = {
      sku: sku,
      quantity: 1,
      props: {
        name: this.props.name || this.props.base_sku,
        price: this.props.price,
        options: options,
      },
    };
    // fill in human-readable options
    if (typeof(this.props.options[this.state.selected_option])!="undefined")

    // set item url
    item.props.url = location.href;
    // get image preview url
    item.props.image = this.props.image;

    // add to cart
    BowAndDrape.cart_menu.add(item);

    // google track event
    try {
      let ga_item = {
        id: item.sku,
        name: item.props.name || item.sku,
        brand: "Bow & Drape",
        price: item.props.price,
        quantity: 1,
      }
      gtag('event', 'add_to_cart', {value: item.props.price, currency:'usd', items: [ga_item]});
    } catch(err) {console.log(err)}
    // facebook track event
    try {
      fbq('track', 'AddToCart', {
        value: parseFloat(item.props.price),
        currency: "USD",
        content_ids: item.sku,
        content_type: "product",
      });
    } catch(err) {console.log(err)}

    location.href = "/cart";
  }

  render() {
    let option_wrapper = null;
    if (this.props.options) {
      let options = [];
      this.props.options.forEach((option, index) => {
        let className = "option";
        if (index==this.state.selected_option)
          className += " selected";
        options.push(
          <div
            className={className}
            key={option.name}
            value={index}
            onClick={()=>{this.setState({selected_option:index});}}
          >
            <img src={option.selector_image} alt={option.name}/>
          </div>
        );
      });
      option_wrapper = <div className="options" value={this.state.selected_option}>{options}</div>
    }

    return (
      <div className="hero_product">
        <div className="media">
          <img src={this.props.image}/>
        </div>
        <div className={`add_to_cart ${this.props.options.length?"haz_options":""}`}>
          {option_wrapper}
          <div className="productName">{this.props.name} <span className="productPrice">${this.props.price}</span></div>
          <BADButton className="primary addCart" onClick={this.handleAddToCart.bind(this)}>Add To Cart</BADButton>
        </div>
        <div className="copy product_details" dangerouslySetInnerHTML={{__html:this.props.copy}}/>
      </div>
    );
  }
}
module.exports = HeroProduct;
