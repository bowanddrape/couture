
const https = require('https');
const React = require('react');

const UserProfile = require('./UserProfile.jsx');

/***
This lives in the menu and handles facebook login integration
***/
class FacebookLogin extends React.Component {
  constructor(props) {
    super(props);
    this.fbLogin = this.fbLogin.bind(this);
  }

  componentDidMount() {
    var self = this;
    window.fbAsyncInit = function() {
      FB.init({
        appId      : '489548524391176',
        cookie     : true,
        xfbml      : true,
        version    : 'v2.8'
      });

      FB.getLoginStatus(self.handleFBLoginStatus.bind(self));
    };

    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "//connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }

  fbLogin() {
    FB.login(this.handleFBLoginStatus.bind(this));
  }

  handleFBLoginStatus(response) {
    if (response.status === 'connected') {
      return this.sendServerLogin(response.authResponse.accessToken);
    }

    if (response.status === 'not_authorized') {
      /* The person is logged into Facebook, but not your app.*/
        'into this app.';
    } else {
      /* The person is not logged into Facebook, so we're not sure if
      they are logged into this app or not. */
        'into Facebook.';
    }
  }

  sendServerLogin(access_token) {
    console.log('FB login initiated!  Fetching your information.... ');
    FB.api('/me?fields=id,name,email,picture', function(response) {
      BowAndDrape.api("POST", "/user/login", {fb_access_token: access_token}, (err, response) => {
        if (err)
          Errors.emitError("login", err);
        BowAndDrape.dispatcher.handleAuth(response);
      });
    });
  }

  render() {
    // when logged in
    if (this.props.user && this.props.user.email) {
      return null;
    }
    // otherwise show login button
    return (
      <button className="loginBtn" onClick={this.fbLogin}>
        Login with Facebook
      </button>
    )
  }
}

module.exports = FacebookLogin;
