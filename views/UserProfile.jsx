

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
      return (
        <UserLogin />
      );
    }

    return (
      React.createElement("user", {},
        <img src={this.props.user.props.image} onError={(event)=>{event.target.setAttribute('src', '/smily_tongue.svg')}}/>,
        <name>{this.props.user.props.name}</name>,
        "! Welcome Home!",
      )
    );
  }

}

module.exports = UserProfile;
