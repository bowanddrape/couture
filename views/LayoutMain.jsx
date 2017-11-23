
const React = require('react');

const LayoutBorderWrap = require('./LayoutBorderWrap.jsx');
const LayoutHeader = require('./LayoutHeader.jsx');
const LayoutFooter = require('./LayoutFooter.jsx');

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
    this.state = {
      user: {},
    };
  }

  componentDidMount() {
    BowAndDrape.dispatcher.on("user", (user) => {
      this.setState({user, user});
    });

    // bind resize
    window.addEventListener("resize", () => {BowAndDrape.dispatcher.emit("resize");});

    BowAndDrape.dispatcher.emit("loaded");
    window.addEventListener("load", () => {
      BowAndDrape.dispatcher.emit("resize");
    });
  }

  render() {
    let content = [];
    let props_contents = this.props.content;
    let static_server_render = false;
    if (typeof(props_contents)=='string') {
      props_contents = props_contents.replace(/\n/g, "\\n");
      props_contents = JSON.parse(props_contents);
    }
    for (let i=0; i<props_contents.length; i++) {
      let props = props_contents[i].props;
      props.key = content.length;
      let component = null;
      if (typeof(document)=='undefined')
        component = require("../views/"+props_contents[i].name+".jsx");
      else
        component = BowAndDrape.views[props_contents[i].name];
      content.push(React.createElement(
        component,
        props
      ));
    };

    let zoom = 1;
    if (typeof(document)!="undefined")
      zoom = document.body.clientWidth / window.innerWidth;
    return (
      <div className="layout_main">
        <link rel="stylesheet" href="/styles.css" type="text/css"></link>
        <LayoutBorderWrap />
        <LayoutHeader user={this.state.user}/>

        <div className="announcement" style={{color:"#fff",backgroundColor:"#ff5c5c",width:"100%",textAlign:"center"}}>
          <div style={{fontFamily: "zurichbold_condensed"}}>
            BUY ONE SWEATSHIRT, GET ONE 50% OFF!
          </div>
          <div style={{fontFamily: "zurichbold_condensed"}}>
            <span style={{fontSize:"10px"}}>USE CODE: BLACKFRIYAY</span>
          </div>
        </div>

        {content}
        <LayoutFooter user={this.state.user}/>

        <script src="/BowAndDrape.js"></script>

        <script dangerouslySetInnerHTML={{__html:`
          var BowAndDrape = require("BowAndDrape");
          var React = BowAndDrape.React;
          var ReactDOM = BowAndDrape.ReactDOM;
          var content = ${JSON.stringify(this.props.content)};
          if (content != "undefined") {
            var layout = React.createElement(BowAndDrape.views.LayoutMain, {
              content_string: \`${(typeof(document)!="undefined")?this.props.content_string:escape(this.props.content_string)}\`,
              content,
            });
            ReactDOM.hydrate(
              layout,
              document.querySelector(".layout")
            );
          }
        `}} >
        </script>

        {/* Zopim Live Chat Script */}
        <script dangerouslySetInnerHTML={{__html:`// &lt;![CDATA[
          window.$zopim||(function(d,s){var z=$zopim=function(c){z._.push(c)},$=z.s= d.createElement(s),e=d.getElementsByTagName(s)[0];z.set=function(o){z.set. _.push(o)};z._=[];z.set._=[];$.async=!0;$.setAttribute('charset','utf-8'); $.src='//cdn.zopim.com/?Q4N5gKntLCE7FT6MI3AtGRDck6kwMqzP';z.t=+new Date;$. type='text/javascript';e.parentNode.insertBefore($,e)})(document,'script');
          // ]]&amp;gt;</script>
          <div __jx__id="___$_2 ___$_1" style="position: absolute; visibility: hidden; border: 0px none; padding: 0px; margin: 0px; width: 0px; height: 0px;" class=" livechat"></div>
        `}} ></script>

         <script dangerouslySetInnerHTML={{__html: `(function (w,i,d,g,e,t,s) {w[d] = w[d]||[];
          t= i.createElement(g);t.async=1;t.src=e;s=i.getElementsByTagName(g)[0];s.parentNode.insertBefore(t, s);})
         (window, document, '_gscq','script','//widgets.getsitecontrol.com/25008/script.js');`}} ></script>

      </div>
    )
  }
}

module.exports = LayoutMain;
