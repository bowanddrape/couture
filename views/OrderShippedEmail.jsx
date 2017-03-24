
const React = require('react');

class OrderShippedEmail extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    return (
      <table align="center"><tbody>
        <tr><td style={styles.fullwidth}>
          <a href={this.props.order_link} style={{margin:"auto"}}><img src="http://www.bowanddrape.com/public/images/bad-logo.png" width="300" alt="Bow & Drape" />
          </a>
        </td></tr>
        <tr><td style={styles.fullwidth}>
          Dear {this.props.username},<br/>your <a href={this.props.order_link}>order {this.props.order_id}</a> has shipped!
        </td></tr>
        <tr><td style={styles.fullwidth}>
          <a href={this.props.tracking_link} style={{margin:"auto",display:"block"}}>Track it</a>
        </td></tr>
      </tbody></table>
    );
  }
}

let styles = {
  fullwidth: {
    width: "100%",
    maxWidth: "600px",
    height: "auto",
  }
}

module.exports = OrderShippedEmail;
