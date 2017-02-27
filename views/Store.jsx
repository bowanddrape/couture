
const React = require('react');
const Item = require('./Item.jsx');

class Store extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let products = [];
    if (this.props.products) {
      for (let i=0; i<this.props.products.items.length; i++) {
        products.push(<Item key={i} {...this.props.products.items[i]} />);
      }
    }

    return (
      <div>
        {products}
        {JSON.stringify(this.props.products)}
      </div>
    );
  }
}
module.exports = Store;
