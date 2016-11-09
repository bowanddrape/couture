

const React = require('react');

class UserProfile extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    // ignore if we don't have a user
    if (!this.props.user || !this.props.user.name) {
      return null;
    }

    return (
      React.createElement("user", {},
        <img src={this.props.user.props.image}></img>,
        <name>{this.props.user.props.name}</name>
      )
    );
  }

  static sendLoginRequest(payload) {
    // login to bowanddrape
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/user/login", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
      if (this.readyState!=4) { return; }
      BowAndDrape.dispatcher.handleAuth(JSON.parse(this.responseText));
    }

    xhr.send(JSON.stringify(payload));
  }
}

module.exports = UserProfile;
