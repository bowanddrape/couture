
const React = require('react');
const Items = require('./Items.jsx');

/***
Transactional email. Send this when an order is shipped
***/
class OrderShippedEmail extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <table align="center" style={{width:"100%"}}><tbody>
        <tr><td style={styles.fullwidth}>
          Dear {this.props.username},<br/><br/>
          Your order <a href={this.props.order_href} style={styles.link}>{this.props.order_id}</a> has shipped!
        </td></tr>
        <tr><td style={styles.fullwidth}>
          {/* this should work, but doesn't with our styles:
            <Items contents={this.props.contents}/>
            so let's just use an image instead
          */}
          <img src={`${this.props.order_link}?layout=image&token=${this.props.token}`} style={{width:"600px"}}/>
          <a href={this.props.tracking_link} style={styles.link}>
            <div style={{margin:"10px 0px",display:"block",border:"1px solid #bababa",padding:"10px",textAlign:"center",fontSize:"12px"}}>
              TRACK YOUR SHIPMENT
            </div>
          </a>
        </td></tr>
      </tbody></table>
    );
  }
}

let styles = {
  link: {
    color: "#F5C9CA"
  }
}

module.exports = OrderShippedEmail;
