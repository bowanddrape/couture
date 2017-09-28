
const React = require('react');
const Items = require('./Items.jsx');
const styles = require('./EmailStyles.js');

/***
Transactional email. Send this when an order is shipped
***/
class OrderPlacedEmail extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <table align="center" style={{width:"100%"}}><tbody>
        <tr><td>
          <h1 style={styles.h1}>YOUR ORDER</h1>
          <h1 style={styles.h1}>HAS BEEN PLACED</h1>
          <a href={this.props.order_link} style={{textDecoration:"none"}}>
            <div style={styles.block_link}>Order ID {this.props.order_id}</div>
          </a>
          <img src={"https://couture.bowanddrape.com/Icon-Phone-Red-Heart.png"} style={{width:"150px",margin:"auto",display:"block"}}/>
          <div style={{textAlign:"center"}}>
            <div style={styles.text}>We recommend that you print this confirmation and</div>
            <div style={styles.text}>frame it above your bed, or take a screenshot</div>
            <div style={styles.text}>and make it your phone background</div>
          </div>
          {/* this should work, but doesn't with our styles:
            <Items contents={this.props.contents}/>
            so let's just use an image instead
          */}
          <img src={`${this.props.order_link}?layout=image&token=${this.props.token}`} style={{width:"600px",margin:"20px auto"}}/>
        </td></tr>
      </tbody></table>
    );
  }
}

module.exports = OrderPlacedEmail;
