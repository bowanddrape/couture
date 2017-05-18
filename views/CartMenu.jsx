
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
      } catch (err) {}
    }
    contents = contents || [];
    this.update(contents);
  }

  update(contents) {
    window.localStorage.setItem("cart", JSON.stringify(contents));
    this.setState({contents: contents});
    BowAndDrape.dispatcher.emit("update_cart", contents);
  }

  add(item) {
    let contents = this.state.contents;
    contents.unshift(item);
    this.update(contents);
    /* TODO maybe save this if logged in?
    BowAndDrape.api('POST', '/cart', item, (err, ret) => {});
    */
  }

  remove(index) {
    let contents = this.state.contents;
    contents.splice(index, 1);
    this.update(contents);
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
