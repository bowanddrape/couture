
const React = require('react');
const querystring = require('querystring');
const Switch = require('./Switch.jsx');
const BADButton = require('./BADButton.jsx');
const ProductList = require('./ProductList.jsx');

/***
Display a single product
***/
class HeroProduct extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selected_option: 0,
    };
    if (this.props.product.options) {
      this.state.selected_option = Object.keys(this.props.product.options)[0];
    }
  }

  static preprocessProps(options, callback) {
    if (options.customizer) {
      let query_params = querystring.parse(options.customizer.split('?')[1]);

      return ProductList.preprocessProps({store:options.store, c:query_params.c}, (err, product_list) => {
        if (err)
          return callback("HeroProduct::customization "+err.toString());
        product_list = new ProductList(product_list);
        let selected_product = product_list.props.selected_product;
        if (selected_product.length>1)
          selected_product.pop();
        let product_map = product_list.state.product_map;
        let product = product_map[selected_product[0]];
        for (let i=1; product && i<selected_product.length; i++) {
          product = product.options[selected_product[i]];
        }
        product.props.image = `/store/${options.store[0].id}/preview?c=${query_params.c}`;
        product.assembly = product_list.props.initial_assembly;
        product.props.options = selected_product;
        if (product.options) {
          Object.keys(product.options).forEach((key) => {
            product.options[key].props.image = product.props.image;
            product.options[key].assembly = product.assembly;
            product.options[key].props.options = selected_product.concat([key]);
          });
        }
        options.product = product;
        return callback(null, options);
      });
    }

    // otherwise we're a premade ats product
    let product_options = {};
    if (options.options) {
      options.options.forEach((option) => {
        let name = option.name.trim().toLowerCase().replace(/_/g,"");
        product_options[option.name] = {
          sku: `${options.base_sku}_${name}`,
          props: {
            name: `${options.name}, ${option.name}`,
            price: options.price,
            image: options.image,
          },
        };
      });
    }
    let product = {
      sku: options.base_sku,
      props: {
        name: options.name || options.base_sku,
        price: options.price,
        image: options.image,
      },
      options: product_options,
    }
    options.product = product;
    return callback(null, options);
  }

  handleAddToCart(event) {
    let product = this.props.product;
    if (product.options && typeof(product.options[this.state.selected_option])!="undefined")
      product = product.options[this.state.selected_option];
    product.quantity = 1;
    // set item url
    product.props.url = location.href;

    // add to cart
    BowAndDrape.cart_menu.add(product);

    // google track event
    try {
      let ga_item = {
        id: product.sku,
        name: product.props.name || product.sku,
        brand: "Bow & Drape",
        price: product.props.price,
        quantity: 1,
      }
      gtag('event', 'add_to_cart', {value: product.props.price, currency:'usd', items: [ga_item]});
    } catch(err) {console.log(err)}
    // facebook track event
    try {
      fbq('track', 'AddToCart', {
        value: parseFloat(product.props.price),
        currency: "USD",
        content_ids: product.sku,
        content_type: "product",
      });
    } catch(err) {console.log(err)}

    location.href = "/cart";
  }

  render() {
    let option_wrapper = null;
    if (this.props.product.options) {
      let options = [];
      Object.keys(this.props.product.options).forEach((option, index) => {
        let className = "option";
        if (option==this.state.selected_option)
          className += " selected";
        options.push(
          <div
            className={className}
            key={option}
            value={index}
            onClick={()=>{this.setState({selected_option:option});}}
          >
            <img src={`/${option.trim().toLowerCase()}.svg`} alt={option}/>
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
        <div className={`add_to_cart ${this.props.options&&this.props.options.length?"haz_options":""}`}>
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
