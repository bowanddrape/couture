
const React = require('react');

const FacebookLogin = require('./FacebookLogin.jsx');
const UserProfile = require('./UserProfile.jsx');

class UserMenu extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    let menu_items = [];
    let key = 0;

    menu_items.push(<UserProfile key={key++} {...this.props}/>);
    menu_items.push(<FacebookLogin key={key++} {...this.props}/>);
    if (this.props.user&&this.props.user.roles&&this.props.user.roles.length) {
      menu_items.push(<a href="/store" key={key++} disabled>Admin Store</a>);
      menu_items.push(<a href="/fulfillment" key={key++} disabled>Order Fulfillment</a>);
    }
    menu_items.push(<a key={key++} href="#" disabled>Customize</a>);
    menu_items.push(<a key={key++} href="#" disabled>Gift Cards</a>);
    if (this.props.user&&this.props.user.email)
      menu_items.push(<button key={key++} onClick={this.logout.bind(this)}>Logout</button>);

    return (
      React.createElement("menu", {},
        menu_items,
        <handle/>
      )
    );
  }
  logout() {
    // TODO also logout facebook
    BowAndDrape.dispatcher.handleAuth({});
  }

}

module.exports = UserMenu;
