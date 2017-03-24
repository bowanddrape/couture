
const React = require('react');

class OrderSurveyEmail extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    return (
      <table align="center"><tbody>
        <tr><td style={styles.fullwidth}>
          <img src="http://www.bowanddrape.com/public/images/bad-logo.png" width="300" alt="Bow & Drape" style={styles.centered} />
        </td></tr>
        <tr><td style={styles.fullwidth}>
          Dear {this.props.username},<br/>
          Thank you for your recent purchase!<br/>
          Please help us make your design experience the best it can be by answering 3 simple questions.<br/><br/>
        </td></tr>
        <tr><td style={styles.fullwidth}>
          <a href="https://docs.google.com/spreadsheet/viewform?fromEmail=true&formkey=dF9xcU5LcDNXekZVanQtQXZZOF9kalE6MQ" style={styles.centered}>
            <div style={{margin:"auto",display:"block",border:"1px solid #bababa", padding:"10px", width:"190px", fontSize:"12px"}}>
              SHARE YOUR THOUGHTS HERE
            </div>
          </a>
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
  },
  centered: {
    margin:"auto",
    display:"block",
  }
}

module.exports = OrderSurveyEmail;
