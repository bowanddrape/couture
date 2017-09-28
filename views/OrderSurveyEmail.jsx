
const React = require('react');
const styles = require('./EmailStyles.js');

/***
Transactional email. Send this when you want to survey someone on a recently
recieved product
***/
class OrderSurveyEmail extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    return (
      <table align="center" style={{width:"100%"}}><tbody>
        <tr><td style={styles.fullwidth}>
          <div style={styles.text}>
            Dear {this.props.username},<br/><br/>
            Thank you for your recent purchase!<br/>
            Please help us make your design experience the best it can be by answering 3 simple questions.
          </div>
        </td></tr>
        <tr><td style={styles.fullwidth}>
          <a href="https://docs.google.com/spreadsheet/viewform?fromEmail=true&formkey=dF9xcU5LcDNXekZVanQtQXZZOF9kalE6MQ" style={styles.link}>
            <div style={{margin:"10px 0px",display:"block",border:"1px solid #bababa",padding:"10px",textAlign:"center",fontSize:"12px"}}>
              SHARE YOUR THOUGHTS HERE
            </div>
          </a>
        </td></tr>
      </tbody></table>
    );
  }
}

module.exports = OrderSurveyEmail;
