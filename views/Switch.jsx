

const React = require('react');
const Stroke = require('./Stroke.jsx');

class Switch extends React.Component {
  constructor(props) {
    super(props);

    this.stroke = (<Stroke data="/flower_stroke.svg" style={{zIndex:"-1",width:"300px",height:"100px",position:"absolute",top:"-30px",left:"-30px"}} draw_loaded={true} duration={5}/>);
  }


  render() {
    let options = [];
    let children = React.Children.toArray(this.props.children);
    for (let index=0; index<children.length; index++) {
      let child = children[index];
      if (child.type!="option") continue;
      options.push(
        <switch_option ref={index} key={index} {...child.props} style={{position:"relative",margin:"0 10px",color:this.props.value==child.props.value?"#000":"#f7afc9"}} onClick={()=>{console.log(child.props.value); this.props.onChange(child.props.value)}}>
          <div style={{textAlign:"center",width:"160px"}}>{child.props.children}</div>
          {child.props.value==this.props.value?
          <Stroke data="/select_stroke.svg" style={{zIndex:"-1",width:"200px",height:"100px",position:"absolute",top:"-28px",left:"-20px"}} draw_on_load={true} duration={1}/>
          :null}
        </switch_option>
      );
    }
    return (
      <switch style={styles.switch}>
        {options}
      </switch>
    )
  }
}
let styles = {
  switch: {
    display: "flex",
    flexFlow: "row wrap",
  },
  option: {
  }
}

module.exports = Switch;
