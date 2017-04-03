
const React = require('react');

class OrderShippedEmail extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    return (
      <table align="center" style={{width:"100%"}}><tbody>
        <tr><td style={styles.fullwidth}>
          Dear {this.props.username},<br/><br/>
          Your order <a href={this.props.order_link} style={styles.link}>{this.props.order_id}</a> has shipped!
        </td></tr>
        <tr><td style={styles.fullwidth}>
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
    color: "#c79e6a"
  }
}

module.exports = OrderShippedEmail;
