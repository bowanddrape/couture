
const React = require('react');

class UserVerifyEmail extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    return (
      <table align="center">
        <tr><td style={styles.fullwidth}>
            <img src="https://staging.bowanddrape.com/sprite.png" width="600" alt="some image" />
        </td></tr>
        <tr><td style={styles.fullwidth}>
            <a href={this.props.link}><img src="http://www.bowanddrape.com/public/images/bad-logo.png" width="600" alt="some image" />
            </a>
          </td></tr>
      </table>
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
