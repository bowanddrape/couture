
const React = require('react');
const Items = require('./Items.jsx');

/***
Draw after successful purchase

"Thank You!" title
Cute gif
"Your order is complete!"
Additional copy
Cart contents


***/
class ThanksPurchaseComplete extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: this.props.items || [],
    }
  }

  render() {

    return (
      <div className="purchase_complete">
        <div>
          <h1>Thank you for your purchase!</h1>
        </div>
        <div>
          <img src = "/thanks.gif" />
        </div>
        <div>
          <p>Helper puppies have been dispatched to create your order!</p>
        </div>
        <div>
          <Items contents = {this.state.items} />
        </div>
      </div>
    );
  }
}


module.exports = ThanksPurchaseComplete;
