

const React = require('react');
const Item = require('./Item.jsx');

// optional props: ["is_cart"]
class Items extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contents: this.props.contents || [],
    }
  }

  componentDidMount() {
    if (this.props.is_cart) {
      if (BowAndDrape.cart_menu) {
        this.updateContents(BowAndDrape.cart_menu.state.contents);
      }
      BowAndDrape.dispatcher.on("update_cart", this.updateContents.bind(this));
    }
  }

  updateContents(contents) {
    contents = contents || [];
    this.setState({contents});
  }

  render() {
    let items = [];
    for (let i=0; i<this.state.contents.length; i++) {
      items.push(<Item key={items.length} {...this.state.contents[i]} onRemove={BowAndDrape.cart_menu.remove.bind(BowAndDrape.cart_menu, items.length)}/>);
    }
    if (this.props.is_cart) {
    }

    if (typeof(window)!="undefined" && !items.length)
      return (
        <errors><div>{this.props.is_cart?"Cart is empty":"No items"}</div></errors>
      );

    return (
      <cart>
        {items}
      </cart>
    );
  }
}
module.exports = Items;
