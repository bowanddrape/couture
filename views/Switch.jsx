

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
  }

  render() {
    let options = [];
    let children = React.Children.toArray(this.props.children);
    for (let index=0; index<children.length; index++) {
      let child = children[index];
      if (child.type!="option") continue;
      options.push(
        <switch_option ref={index} key={index} {...child.props} style={{
          position: "relative",
          margin: "0 10px",
          color:this.props.value==child.props.value?"#000":"#f7afc9"
        }} onClick={
          ()=>{this.props.onChange(child.props.value)}
        }>
          <div style={{zIndex:"2",textAlign:"center",width:"160px"}}>
            {child.props.children}
          </div>
          {
            (child.props.value==this.props.value) ?
              <Stroke data="/select_stroke.svg" style={{
                zIndex: "2",
                width: "200px",
                height: "100px",
                position: "absolute",
                top: "-28px",
                left: "-20px",
              }} draw_on_load={true} duration={1}/>
              : null
          }
        </switch_option>
      );
    }
    return (
      <switch style={{
        display: "flex",
        flexFlow: "row wrap",
      }}>
        {options}
      </switch>
    )
  }
}

module.exports = Switch;
