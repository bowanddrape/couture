
const React = require('react');
const UserLogin = require('./UserLogin.jsx');
const jwt_decode = require('jwt-decode');

/***
Page allowing user to reset password / verify account
user jwt must be in the document.location.href
***/
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

    UserLogin.hashPassword(auth.user.email, password, (err, passhash) => {
      let payload={passhash: passhash};
      BowAndDrape.api("POST", "/user/reset_password", payload, (err, response) => {
        // TODO handle errors?
        BowAndDrape.dispatcher.handleAuth(response);
        document.location = '/';
      });
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
