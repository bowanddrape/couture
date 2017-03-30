
const React = require('react');

class Cart extends React.Component {
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
    if (BowAndDrape.cart) return;
    BowAndDrape.cart = this;

    // get our cart contents from cookie
    let contents = BowAndDrape.readCookie("cart");
    if (contents) {
      try {
        contents = JSON.parse(contents);
        this.setState({contents: contents});
        this.updateCookie(contents);
      } catch (err) {
        // expire if borked
        document.cookie = "cart=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }
    }
  }

  updateCookie(contents) {
    // update cookie
    var d = new Date();
    d.setTime(d.getTime() + (356*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = "cart=" + JSON.stringify(contents) + ";" + expires + ";path=/";
    BowAndDrape.dispatcher.emit("update_cart", contents);
  }

  add(item) {
    let contents = this.state.contents;
    contents.unshift(item);
    this.setState({contents});
    this.updateCookie(contents);
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
module.exports = Cart;
