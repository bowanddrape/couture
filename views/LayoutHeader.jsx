
const React = require('react');

const FacebookLogin = require('./FacebookLogin.jsx');
const UserProfile = require('./UserProfile.jsx');
const CartMenu = require('./CartMenu.jsx');

/***
Draw the header
props:
  user:{} // user object
***/
class LayoutHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
      desktop_mode: false,
    }
  }

  render() {
    let menu_items = [];

    menu_items.push(<UserProfile key={menu_items.length} {...this.props}/>);
    menu_items.push(<FacebookLogin key={menu_items.length} {...this.props}/>);
    menu_items.push(<a key={menu_items.length} href="/customize-your-own"><button className="primary">Customize</button></a>);
    // links to admin pages
    if (this.props.user&&this.props.user.roles&&this.props.user.roles.length) {
      menu_items.push(<a href="/store" key={menu_items.length}><button className="primary">Admin Store</button></a>);
      menu_items.push(<a href="/fulfillment" key={menu_items.length}><button className="primary">Order Fulfillment</button></a>);
      menu_items.push(<a href="/vss/admin" key={menu_items.length}><button className="primary">VSS Admin</button></a>);
    }
    if (this.props.user&&this.props.user.roles&&this.props.user.roles.indexOf("bowanddrape")>=0) {
      menu_items.push(<a href="/page" key={menu_items.length}><button className="primary">Admin Pages</button></a>);
    }
    if (this.props.user&&this.props.user.email)
      menu_items.push(<a key={menu_items.length} onClick={this.logout.bind(this)}><button>Logout</button></a>);

    if (this.state.desktop_mode) {
      return (
        <div className="header">
        </div>
      )
    }

    return (
      <div className="header">
        <handle onClick={()=>{this.setState({expanded:!this.state.expanded})}}/>
        <img className="logo" src="/logo_mini.svg" />
        <CartMenu key={menu_items.length} />
        <menu className={this.state.expanded?"expanded":""}>{menu_items}</menu>
      </div>
    );
  }

  logout() {
    // FIXME we also need to unauth or logout facebook
    BowAndDrape.dispatcher.handleAuth({});
    location.reload();
  }

}

module.exports = LayoutHeader;
