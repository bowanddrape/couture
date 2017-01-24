
const React = require('react');
const UserProfile = require('./UserProfile.jsx');
const jwt_decode = require('jwt-decode');

class UserPasswordReset extends React.Component {
  constructor(props) {
    super(props);

    this.sendResetPassword = this.sendResetPassword.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  sendResetPassword() {
    // login to bowanddrape
    let password = document.getElementById("password").value;
    let auth = this.getUser();

    UserProfile.hashPassword(auth.user.email, password, (err, passhash) => {
      let payload={passhash: passhash};
      let xhr = new XMLHttpRequest();
      xhr.open("POST", "/user/reset_password", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Authorization", "Bearer "+auth.token);
      xhr.onreadystatechange = function() {
        if (this.readyState!=4) { return; }
        // TODO display error on anything not status 200
        BowAndDrape.dispatcher.handleAuth(JSON.parse(this.responseText));
        document.location = '/';
      }

      xhr.send(JSON.stringify(payload));
    });
 }

  getUser() {
    let token = document.location.href.substring(document.location.href.lastIndexOf('/')+1);
    let user = jwt_decode(token);
    return {user: user, token: token};
  }

  render() {
    let user_name = "User";
    if (typeof(document)!='undefined') {
      let user = this.getUser().user;
      user_name = user.props.name;
    }

    return (
      <div style={{display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'center'}}>
        <text>Welcome back, {user_name}! Your account is now verified!</text>
        <text>Please set a new password</text>
        <div>
          <input id="password" placeholder="password" type="password"/>
          <button onClick={this.sendResetPassword}>Save</button>
        </div>
      </div>
    );
  }

}

module.exports = UserPasswordReset;
