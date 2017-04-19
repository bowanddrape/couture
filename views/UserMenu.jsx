
const React = require('react');

const FacebookLogin = require('./FacebookLogin.jsx');
const UserProfile = require('./UserProfile.jsx');
const Cart = require('./Cart.jsx');

class UserMenu extends React.Component {
  constructor(props) {
    super(props);

    this.handleToggleMenu = this.props.handleToggleMenu;
  }

  render() {

    let menu_items = [];
    let key = 0;

    menu_items.push(<UserProfile key={key++} {...this.props}/>);
    menu_items.push(<FacebookLogin key={key++} {...this.props}/>);
    menu_items.push(<Cart key={key++} />);
    menu_items.push(<a key={key++} href="/customize-your-own" disabled>Customize</a>);
    // links to admin pages
    if (this.props.user&&this.props.user.roles&&this.props.user.roles.length) {
      menu_items.push(<a href="/store" key={key++} disabled>Admin Store</a>);
      menu_items.push(<a href="/fulfillment" key={key++} disabled>Order Fulfillment</a>);
    }
    if (this.props.user&&this.props.user.roles&&this.props.user.roles.indexOf("bowanddrape">=0)) {
      menu_items.push(<a href="/page" key={key++} disabled>Admin Pages</a>);
    }
    if (this.props.user&&this.props.user.email)
      menu_items.push(<button key={key++} onClick={this.logout.bind(this)}>Logout</button>);

    return (
      <menu>
        {menu_items}
        <handle onClick={this.handleToggleMenu}/>
      </menu>
    );
  }
  logout() {
    // TODO also logout facebook
    BowAndDrape.dispatcher.handleAuth({});
  }

}

module.exports = UserMenu;
