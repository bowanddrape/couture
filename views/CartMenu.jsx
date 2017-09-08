
const React = require('react');

/***
This is the cart link and bug in the menu. Also manages the cart contents

cart contents are saved in localstorage
***/
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
    this.setState((prevstate, prevprops) => {
      return ({contents});
    });
  }

  componentDidUpdate() {
    BowAndDrape.dispatcher.emit("update_cart", this.state.contents);
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
    let num_cart_items = 0;
    this.state.contents.forEach((item) => {
      if (item.sku)
        num_cart_items += 1;
    });

    if (!num_cart_items) {
      return (
        <a className="cartmenu" href="/customize-your-own">
        </a>
      );
    }

    return (
      <a className="cartmenu" href="/cart">
        <cart_bug>{num_cart_items}</cart_bug>
      </a>
    );
  }
}
module.exports = CartMenu;
