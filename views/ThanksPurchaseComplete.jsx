
const React = require('react');
const Items = require('./Items.jsx');
const Signup = require('./Signup.jsx');

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
          <img className="hero_gif" src="/thanks.gif" />
        </div>
        <div>
          <p>Helper puppies have been dispatched to create your order!</p>
        </div>
        <div>
          <Items contents = {this.state.items} />
        </div>
        <div style={{width:"600px",margin:"20px auto",borderBottom:"solid 1px #000"}}/>
        <Signup
          hidden_keys={{email:this.props.email}}
          misc_keys={["Other comments?"]}
          selectors={{"From 1 being \"that's a hard nope\" to 10 being \"absolutely\", how likely are you to recommend Bow & Drape to your friends?": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]}}
        />
      </div>
    );
  }
}


module.exports = ThanksPurchaseComplete;
