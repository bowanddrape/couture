
const React = require('react');
const Signup = require('./Signup.jsx');



/***
Draw the header
props:
  user:{} // user object
***/
class LayoutFooter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
      desktop_mode: false,
    }
  }

  render() {
    let menu_items = [];

    menu_items.push(<a className="social twitter" key={menu_items.length} href="//twitter.com/bowanddrape"></a>);
    menu_items.push(<a className="social instagram" key={menu_items.length} href="//instagram.com/bowanddrape/"></a>);
    menu_items.push(<a className="social facebook" key={menu_items.length} href="//facebook.com/BowAndDrape/"></a>);
    menu_items.push(<a key={menu_items.length} href="/customize-your-own">About Us</a>);
    menu_items.push(<a key={menu_items.length} href="/customize-your-own">Customer Service</a>);
    menu_items.push(<a key={menu_items.length} href="/customize-your-own">Gift Cards</a>);
    menu_items.push(<a key={menu_items.length} href="/customize-your-own">Press</a>);
    menu_items.push(<a key={menu_items.length} href="/customize-your-own">Make Your Own</a>);

    if (this.state.desktop_mode) {
      return (
        <div className="footer">
        </div>
      )
    }

    return (
      <div className="footer">
        <div className="footer-inner">
          <img src="/pencil.svg" className="newsletter-pencil" /><h3 className="center">Get The Latest From Bow & Drape</h3>
            <Signup BtnText="Get It, Get It" unique_keys={["email"]} hidden_keys={{newsletter:true,source:"footer"}}/>
          <menu className="footer-menu">
            <menu_items>
                {menu_items}
            </menu_items>
          </menu>
        </div>
      </div>
    );
  }

}

module.exports = LayoutFooter;
