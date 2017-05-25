
const React = require('react');

/***
Draw after successful purchase
***/
class ThanksPurchaseComplete extends React.Component {
  render() {
    return (
      <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div>Thanks for your purchase!</div>
      </div>
    )
  }
}
module.exports = ThanksPurchaseComplete;
