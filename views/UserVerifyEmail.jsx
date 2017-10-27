
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
            <img src="https://couture.bowanddrape.com/email_reset_password.gif" />
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
