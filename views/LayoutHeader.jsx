
const React = require('react');

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
    }
  }

  render() {
    let menu_items = [];

    menu_items.push(<a key={menu_items.length} href="/customize_your_own"><button className="primary">Customize Your Own</button></a>);
    menu_items.push(<a key={menu_items.length} href="/shop"><button className="primary">Shop</button></a>);
    menu_items.push(<a key={menu_items.length} href="/inspo"><button className="primary">Inspo</button></a>);
    menu_items.push(<a key={menu_items.length} href="/rtw_sale"><button className="primary highlight">LAST-MINUTE GIFTS</button></a>);
    // links to admin pages
    if (this.props.user&&this.props.user.roles&&this.props.user.roles.length) {
      menu_items.push(<a href="/store" key={menu_items.length}><button className="primary">Admin Store</button></a>);
      menu_items.push(<a href="/fulfillment" key={menu_items.length}><button className="primary">Order Fulfillment</button></a>);
      menu_items.push(<a href="/vss/admin" key={menu_items.length}><button className="primary">VSS Admin</button></a>);
    }
    if (this.props.user&&this.props.user.roles&&this.props.user.roles.indexOf("bowanddrape")>=0) {
      menu_items.push(<a href="/announcement" key={menu_items.length}><button className="primary">Announcements</button></a>);
      menu_items.push(<a href="/page" key={menu_items.length}><button className="primary">Admin Pages</button></a>);
      menu_items.push(<a href="/dashboard" key={menu_items.length}><button className="primary">Dashboard</button></a>);
    }

    return (
      <div className="header">
        <div className="headerInner">
          <handle className={this.state.expanded?"expanded":""} onClick={()=>{this.setState({expanded:!this.state.expanded})}}/>
          <a className="logo" href="/"><img src="/logo_mini.svg" /></a>
          <CartMenu key={menu_items.length} />
          <menu className={this.state.expanded?"expanded":""}>
            <menu_items>
              {menu_items}
            </menu_items>
            <UserProfile {...this.props}/>
          </menu>
        </div>
      </div>
    );
  }
}

module.exports = LayoutHeader;
