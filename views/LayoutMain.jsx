
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const Swipeable = require('react-swipeable');

const UserMenu = require('./UserMenu.jsx');

const menu_width = 350;

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
    this.onChildSwiping = this.onChildSwiping.bind(this);
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
  onChildSwiping(e, deltaX, deltaY, absX, absY, velocity) {
    e.stopPropagation();
    console.log(`child ${deltaX} ${deltaY}`);
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

    // bind resize
    let self = this;
    function resize() {
      self.setState({viewport_width:window.innerWidth});
    }
    window.addEventListener("resize", resize);
    resize();

    BowAndDrape.dispatcher.emit("loaded");
  }

  render() {
    let content = null;

    if (typeof(document)=='undefined' || typeof(BowAndDrape.views[this.props.content_name])=='undefined') {
      content = (<div dangerouslySetInnerHTML={{__html:unescape(this.props.content_string)}} />);
    } else {
      content = React.createElement(
        BowAndDrape.views[this.props.content_name],
        JSON.parse(this.props.content_props)
      );
    }

    return (
      <Swipeable
        onSwiping={this.onSwiping}
        onSwiped={this.onSwiped}
        style={{width:"100%",height:"100%",marginLeft:this.state.menu.offset+"px",transition:"margin-left 0.1s"}}
        trackMouse={true}
      >
          <meta httpEquiv="content-type" content="text/html; charset=utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1"/>
          <link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet"/> 
          <link rel="stylesheet" href="/styles.css" type="text/css"></link>
          {content}
          <div style={{position:"fixed",left:(this.state.viewport_width - (this.state.viewport_width*0.01) + this.state.menu.offset)+"px",top:"0px",backgroundColor:"#aaa",width:"100%",height:"100%",transition:"left 0.1s",zIndex:"10"}}>
            <UserMenu handleToggleMenu={this.handleToggleMenuState.bind(this)} {...this.state}/>
          </div>
        {/*<Swipeable
          onSwiping={this.onChildSwiping}
          style={{width:"100px",height:"100px",backgroundColor:"#666"}}
          trackMouse={true}
        ></Swipeable>*/}

        <script src="/BowAndDrape.js"></script>
        <script dangerouslySetInnerHTML={{__html:`

          var BowAndDrape = require("BowAndDrape");
          var React = BowAndDrape.React;
          var ReactDOM = BowAndDrape.ReactDOM;
          var layout = React.createElement(BowAndDrape.views.LayoutMain, {
            content_string: \`${escape(this.props.content_string)}\`,
            content_name: \`${this.props.content_name}\`,
            content_props: \`${this.props.content_props}\`}
          );
          ReactDOM.render(
            layout,
            document.body
          );

        `}} >
        </script>

      </Swipeable>
    )
  }
}

module.exports = LayoutMain;
