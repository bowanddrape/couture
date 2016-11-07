"use strict";

const React = require('react');
const ReactDOM = require('react-dom');
const Swipeable = require('react-swipeable');

class LayoutMain extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      menu_offset: 0,
      menu_offset_threshold_percent: 5
    };

    this.onClick = this.onClick.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);

    this.toggleMenu = this.toggleMenu.bind(this);
    // TODO handle resize
  }

  onTouchStart(event) {
    this.setState({
      initial_touch: event.changedTouches[0],
      console: this.state.console+" start ["+Math.round(event.changedTouches[0].screenX)+","+Math.round(event.changedTouches[0].screenY)+"]"
    });
  }
  onTouchMove(event) {
    // we're looking for swipes, so ignore any multi-touch
    if (event.changedTouches.length > 1) return;

    let touch_move = [
      event.changedTouches[0].screenX - this.state.initial_touch.screenX,
      event.changedTouches[0].screenY - this.state.initial_touch.screenY,
    ];
    let menu_offset = Math.max(this.state.initial_touch.screenX - event.changedTouches[0].screenX, 0);
    this.setState({
      menu_offset: menu_offset
    });
  }
  onTouchEnd(event) {
    this.setState({
      console: this.state.console+" end"
    });
  }
  onClick(event) {
    this.setState({console: this.state.console+" click"});
    console.log(event.screenX+" "+event.screenY);
  }

  toggleMenu(event) {
    console.log("menu click");
    let new_offset = this.state.menu_offset<800?800:0;
    this.setState({menu_offset: new_offset});
  }

  // extends React.Component
  render() {
    let self = this;

    let menu_style = {
      left: (window.innerWidth - 20 - this.state.menu_offset)+"px"
    }
    let menu = React.createClass({
      render: function() {
        return (
          React.createElement("menu", {style:menu_style},
            React.createElement("handle", {onClick: self.toggleMenu}, <img onClick={this.toggleMenu} src="/hamburger_menu.png"></img>),
            <options>
              <a>Customize Your Own</a>
              <a>Shop</a>
              <a>Limited Edition</a>
              <a>Bridal</a>
              <a>Punny Girls</a>
              <a>Rhony Fans</a>
            </options>
          )
        )
      }
    });

    return (
      React.createElement("main",
        {
          //onClick: this.onClick,
          onTouchStart: this.onTouchStart,
          onTouchMove: this.onTouchMove,
          onTouchEnd: this.onTouchEnd,
          style: {
            position: "relative",
            left: (-1 * this.state.menu_offset)+"px"
          }
        },
        <link rel="stylesheet" href="/styles.css" type="text/css"></link>,
        <top_banner><container><phone>1.800.864.5797</phone><msg>FREE SHIPPING on domestic orders over $75</msg></container></top_banner>,
        <img src="/logo.svg"></img>,
        //React.createElement("content", {}, this.props.content),
        React.createElement("placeholder_content", {},
          <div>
            <button>Customize Your Own</button>
            <img src="/placeholder.png"></img>
          </div>
        ),
        React.createElement(menu, this.props),
        <console>
//          {this.state.console}
        </console>
      )
    )
  }
};

module.exports = {
  React: React,
  ReactDOM: ReactDOM,
  LayoutMain: LayoutMain,
};
