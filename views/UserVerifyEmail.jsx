
const React = require('react');

/***
Transactional email. Send this when a user requested to verify email ownership
***/
class UserVerifyEmail extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <table><tbody>
        <tr><td style={styles.fullwidth}>
          <a href={this.props.link}>
            Click here to reset your password / verify your account
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
  }
}

module.exports = UserVerifyEmail;
