
const React = require('react');

class CartMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contents: [],
    }
  }

  componentDidMount() {
    this.init();
    BowAndDrape.dispatcher.on("loaded", this.init.bind(this));
  }

  init() {
    // init only once globally
    if (BowAndDrape.cart_menu) return;
    BowAndDrape.cart_menu = this;

    // get our cart contents from cookie
    let contents = window.localStorage.getItem("cart");
    if (contents) {
      try {
        contents = JSON.parse(contents);
        this.setState({contents: contents});
        this.updateCookie(contents);
      } catch (err) {
        // expire if borked
        window.localStorage.setItem("cart", null);
      }
    }
  }

  updateCookie(contents) {
console.log("updateCookie", contents);
    window.localStorage.setItem("cart", JSON.stringify(contents));
    BowAndDrape.dispatcher.emit("update_cart", contents);
  }

  add(item) {
    let contents = this.state.contents;
    contents.unshift(item);
    this.setState({contents});
    this.updateCookie(contents);
    /* TODO maybe save this if logged in?
    BowAndDrape.api('POST', '/cart', item, (err, ret) => {});
    */
  }

  remove(index) {
    let contents = this.state.contents;
    contents.splice(index, 1);
    this.setState({contents});
    this.updateCookie(contents);
  }

  render() {
    if (!this.state.contents.length)
      return null;

    return (
      <a href="/cart">
        Cart
        <cart_bug>{this.state.contents.length}</cart_bug>
      </a>
    );
  }
}
module.exports = CartMenu;
