

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

  logout() {
    // logout facebook
    // sometimes facebook doesn't respond
    let timeoutHandler = setTimeout(()=> {
      BowAndDrape.dispatcher.handleAuth({});
      location.reload();
    }, 1000);
    return FB.getLoginStatus((response) => {
      if (response.status !== 'connected') {
        BowAndDrape.dispatcher.handleAuth({});
        location.reload();
      }
      return FB.logout(() => {
        BowAndDrape.dispatcher.handleAuth({});
        location.reload();
      });
    });
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
        <img src={this.props.user.props.image?this.props.user.props.image:"/nope"} onError={(event)=>{event.target.setAttribute('src', '/smily_tongue.svg')}}/>,
        <name>{this.props.user.props.name}</name>,
        ", Welcome Back!",
        <user><a onClick={this.logout.bind(this)}><button>Logout</button></a></user>,
      )
    );
  }

}

module.exports = UserProfile;
