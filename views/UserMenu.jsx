
const React = require('react');

const FacebookLogin = require('./FacebookLogin.jsx');
const UserProfile = require('./UserProfile.jsx');
const CartMenu = require('./CartMenu.jsx');

/***
Draw the user menu
props:
  user:{} // user object
  handleToggleMenu:() // called when toggling menu visiblity
***/
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
    menu_items.push(<CartMenu key={key++} />);
    menu_items.push(<a className="button primary" key={key++} href="/customize-your-own">Customize</a>);
    // links to admin pages
    if (this.props.user&&this.props.user.roles&&this.props.user.roles.length) {
      menu_items.push(<a className="button primary" href="/store" key={key++}>Admin Store</a>);
      menu_items.push(<a className="button primary" href="/fulfillment" key={key++}>Order Fulfillment</a>);
      menu_items.push(<a className="button primary" href="/vss/admin" key={key++}>VSS Admin</a>);

    }
    if (this.props.user&&this.props.user.roles&&this.props.user.roles.indexOf("bowanddrape")>=0) {
      menu_items.push(<a className="button primary" href="/page" key={key++}>Admin Pages</a>);

    }
    if (this.props.user&&this.props.user.email)
      menu_items.push(<a className="button" key={key++} onClick={this.logout.bind(this)}>Logout</a>);

    return (
      <menu>
        {menu_items}
        <handle onClick={this.handleToggleMenu}/>
      </menu>
    );
  }
  logout() {
    // FIXME we also need to unauth or logout facebook
    BowAndDrape.dispatcher.handleAuth({});
  }

}

module.exports = UserMenu;
