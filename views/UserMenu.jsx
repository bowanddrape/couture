
const React = require('react');

const FacebookLogin = require('./FacebookLogin.jsx');
const UserProfile = require('./UserProfile.jsx');

class UserMenu extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    let LoginPassHash = React.createClass({
      render: function() {
        // ignore if already logged in
        if (this.props.user && this.props.user.email) {
          return null;
        }
        return (
          <login>
            <input placeholder="email address" type="text"/>
            <input placeholder="password" type="text"/>
            <button>Login</button>
            <button>Register</button>
          </login>
        )
      }
    });

    return (
      React.createElement("menu", {},
        React.createElement(UserProfile, this.props),
        React.createElement(FacebookLogin, this.props),
        React.createElement(LoginPassHash, this.props),
        <div onClick={this.logout.bind(this)}>{this.props.user&&this.props.user.email?"logout":""}</div>,
        <handle/>
      )
    );
  }
  logout() {
    console.log("logout");
    BowAndDrape.dispatcher.handleAuth({});
  }

}

module.exports = UserMenu;
