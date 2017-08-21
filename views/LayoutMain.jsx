
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const Swipeable = require('react-swipeable');

const UserMenu = require('./UserMenu.jsx');

const menu_width = 350;

/***
The most common of layout. Renders a react component

renders any react component but also the menu and any header elements
props:
  content: [
    {
      name:"" // react component
      props:{} // properties for react component
    }
  ]
  content_string:"" // page as server-side rendered string
***/
class LayoutMain extends React.Component {
  constructor(props) {
    super(props);
    // this is the only place to store state client-side!
    this.state = {
      user: {},
      viewport_width: 9000,
      menu: {offset: 0, open: false}
    };

    this.onSwiping = this.onSwiping.bind(this);
    this.onSwiped = this.onSwiped.bind(this);
  }

  // blacklist certain elements from swipe actions
  targetSwipable(element) {
    // ignore swipe actions on input tags
    if (element.tagName.toLowerCase()=="input")
      return false;
    if (element.classList.contains("component_container") || (element.parentNode&&element.parentNode.classList.contains("component_container")))
      return false;
    return true;
  }

  onSwiping(event, deltaX, deltaY, absX, absY, velocity) {
    if (!this.targetSwipable(event.target))
      return;
    let menu = this.state.menu;
    menu.offset = (menu.state?-menu_width+100:0) - deltaX;
    menu.offset = Math.max(Math.min(menu.offset, 0),-menu_width);
    menu.state = menu.offset < menu_width*-0.5;
    this.setState({menu:menu});
  }
  onSwiped(event, x, y, isFlick, velocity) {
    let menu = this.state.menu;
    menu.offset = menu.state?-menu_width:0;
    this.setState({menu:menu});
  }
  handleToggleMenuState() {
    let menu = this.state.menu;
    menu.state = !menu.state;
    menu.offset = menu.state?-menu_width:0;
    this.setState({menu:menu});
  }

  componentDidMount() {
    BowAndDrape.dispatcher.on("user", (user) => {
      this.setState({user, user});
    });
    BowAndDrape.dispatcher.on("resize", () => {
      this.handleResize();
    });

    // bind resize
    window.addEventListener("resize", () => {BowAndDrape.dispatcher.emit("resize");});
    window.addEventListener("touchend", this.handleResize.bind(this));
    this.handleResize();

    BowAndDrape.dispatcher.emit("loaded");
    BowAndDrape.dispatcher.emit("resize");
  }

  handleResize() {
    this.setState({
      viewport_width:window.innerWidth
    });
  }

  render() {
    let content = null;

    if (typeof(document)=='undefined') {
      content = (<div dangerouslySetInnerHTML={{__html:unescape(this.props.content_string)}} />);
    } else {
      content = [];
      let props_contents = this.props.content;
      let static_server_render = false;
      if (typeof(props_contents)=='string')
        props_contents = JSON.parse(props_contents);
      for (let i=0; i<props_contents.length; i++) {
        // if we didn't get a client-side component, use the server-side render
        if (!BowAndDrape.views[props_contents[i].name]) {
          content = (<div dangerouslySetInnerHTML={{__html:unescape(this.props.content_string)}} />);
          break;
        }
        let props = props_contents[i].props;
        props.key = content.length;
        content.push(React.createElement(
          BowAndDrape.views[props_contents[i].name],
          props
        ));
      };
    }

    let zoom = 1;
    if (typeof(document)!="undefined")
      zoom = document.body.clientWidth / window.innerWidth;

    return (
      <div className="layout">
        <Swipeable
          onSwiping={this.onSwiping}
          onSwiped={this.onSwiped}
          style={{width:"100%",height:"100%",marginLeft:this.state.menu.offset+"px",transition:"margin-left 0.1s"}}
          trackMouse={true}
        >
            <link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet"/>
            <link rel="stylesheet" href="/styles.css" type="text/css"></link>
            {content}
            <div style={{position:"fixed",left:(this.state.viewport_width*zoom*0.99 + this.state.menu.offset)+"px",top:"0px",backgroundColor:"#aaa",width:"100%",height:"100%",transition:"left 0.1s",zIndex:"10"}}>
              <UserMenu handleToggleMenu={this.handleToggleMenuState.bind(this)} {...this.state}/>
            </div>

          <script src="/BowAndDrape.js"></script>
          <script src="/masonry.pkgd.min.js"></script>

          <script dangerouslySetInnerHTML={{__html:`

            var BowAndDrape = require("BowAndDrape");
            var React = BowAndDrape.React;
            var ReactDOM = BowAndDrape.ReactDOM;
            var content = \`${JSON.stringify(this.props.content)}\`;
            if (content != "undefined") {
              content = content.replace(/\\n/g, "");
              var layout = React.createElement(BowAndDrape.views.LayoutMain, {
                content_string: \`${escape(this.props.content_string)}\`,
                content,
              });
              ReactDOM.render(
                layout,
                document.querySelector(".layout")
              );
            }
          `}} >
          </script>

        </Swipeable>
      </div>
    )
  }
}

module.exports = LayoutMain;
