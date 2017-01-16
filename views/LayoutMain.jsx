
const React = require('react');
const Swipeable = require('react-swipeable');

const UserMenu = require('./UserMenu.jsx');

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

  onSwiping(e, deltaX, deltaY, absX, absY, velocity) {
    let menu = this.state.menu;
    menu.offset = (menu.state?-this.state.viewport_width+100:0) - deltaX;
    menu.offset = Math.max(Math.min(menu.offset, 0),-this.state.viewport_width+100);
    this.setState({menu:menu});
  }
  onSwiped(event, x, y, isFlick, velocity) {
    let menu = this.state.menu;
    menu.state = x > 100;
    menu.offset = menu.state?-this.state.viewport_width+100:0;
    this.setState({menu:menu});
  }
  onChildSwiping(e, deltaX, deltaY, absX, absY, velocity) {
    e.stopPropagation();
    console.log(`child ${deltaX} ${deltaY}`);
  }

  componentDidMount() {
    BowAndDrape.dispatcher.on("user", (user) => {
      console.log("got a user event!");
      console.log(user);
      this.setState({user, user});
    });
    // see if we have a user cookie set
    function readCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
    }
    let token = readCookie("token");
    if (token) {
      console.log("cookie token");
      BowAndDrape.dispatcher.handleAuth({token:token});
    }

    // bind resize
    let self = this;
    function resize() {
      self.setState({viewport_width:window.innerWidth});
    }
    window.addEventListener("resize", resize);
    resize();
  }

  render() {
    return (
      <Swipeable
        onSwiping={this.onSwiping}
        onSwiped={this.onSwiped}
        style={{width:"100%",height:"100%",marginLeft:this.state.menu.offset+"px",transition:"margin-left 0.1s"}}
        trackMouse={true}
      >
          <meta httpEquiv="content-type" content="text/html; charset=utf-8" />
          <link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet"/> 
          <link rel="stylesheet" href="/styles.css" type="text/css"></link>
          <div dangerouslySetInnerHTML={{__html:this.props.content}} />
          <div style={{position:"fixed",left:(this.state.viewport_width - 20 + this.state.menu.offset)+"px",top:"0px",backgroundColor:"#aaa",width:"100%",height:"100%",transition:"left 0.1s"}}>
            {React.createElement(UserMenu, this.state)}
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
          var layoutMain = React.createElement(BowAndDrape.LayoutMain, {content: \`${this.props.content}\`});
          ReactDOM.render(
            layoutMain,
            document.body
          );
        `}} >
        </script>

      </Swipeable>
    )
  }
}

module.exports = LayoutMain;
