

const React = require('react');

const UserLogin = require('./UserLogin.jsx');

/***
Widget to show logged-in user. If not logged in, allow user to log in?
props:
  user:{} // user object
***/
class UserProfile extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    // if we don't have a user, display login area
    if (!this.props.user || !this.props.user.email) {
      let errors = [];
      if (this.props.user && this.props.user.error) {
        errors.email = this.props.user.error.email;
        errors.password = this.props.user.error.password;
      }
      return (
        <UserLogin />
      );
    }

    return (
      React.createElement("user", {},
        <img className="pizza" src={this.props.user.props.image}></img>,
        <name>{this.props.user.props.name}</name>,
        "! Welcome Home!",
      )
    );
  }

}

module.exports = UserProfile;
