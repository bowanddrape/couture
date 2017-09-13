

const React = require('react');
const Stroke = require('./Stroke.jsx');

/***
This attempts to emulate a select drop-down, but displays options side-by-side
props:
  value:"" // the selected value
  onChange() // called when something else is selected
children:
  <option value={}>{content}</option>
***/
class Switch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
    }
  }

  render() {
    let options = [];
    let children = React.Children.toArray(this.props.children);
    for (let index=0; index<children.length; index++) {
      let child = children[index];
      if (child.type!="option") continue;
      let child_content = child.props.children;
      options.push(
        <switch_option className={child.props.value==this.props.value?"selected":""} ref={index} key={index} {...child.props} onClick={
          ()=>{this.props.onChange(child.props.value)}
        }>
          <div style={{textAlign:"center"}}>
            <img src={child.props.children.toString().replace(/ /g,"_").toLowerCase()+".svg"} alt={child.props.children} />
          </div>
        </switch_option>
      );
    }
    return (
      <switch
        className={this.state.expanded||this.props.always_expanded?"expanded":""}
        onClick={()=>{this.setState({expanded:!this.state.expanded})}}
        style={this.props.style}
      >
        {options}
      </switch>
    )
  }
}

module.exports = Switch;
