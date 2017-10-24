
const React = require('react');
const PageEditGallery = require("./PageEditGallery.jsx");
const PageEditSignup = require("./PageEditSignup.jsx");
const PageEditTextContent = require("./PageEditTextContent.jsx");
const PageEditCarousel = require("./PageEditCarousel.jsx");

/***
Admin widget for managing CMS pages
Called by PageList
***/
class PageEdit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      path: this.props.path,
      elements: this.props.elements,
    };
  }

  handleNewElement() {
    let elements = this.state.elements;
    elements.push({type:"",props:{}});
    this.setState({elements});
  }

  handleRemoveElement(index) {
    let elements = this.state.elements;
    elements.splice(index, 1);
    this.setState({elements});
  }

  handleMoveElementTop(index) {
    let elements = this.state.elements;
    let moved = elements.splice(index, 1);
    elements.splice(0, 0, moved[0]);
    this.setState({elements});
  }

  handleMoveElementUp(index) {
    let elements = this.state.elements;
    let moved = elements.splice(index, 1);
    elements.splice(index-1, 0, moved[0]);
    this.setState({elements});
  }

  handleMoveElementDown(index) {
    let elements = this.state.elements;
    let moved = elements.splice(index, 1);
    elements.splice(index, 0, moved[0]);
    this.setState({elements});
  }

  handleUpdateProps(index, name, value) {
    let elements = this.state.elements;
    elements[index][name] = value;
    this.setState({elements});
  }

  handleSave() {
    if (!this.state.path)
      return alert("please set a path");
    if (this.state.path[0] != '/')
      this.state.path = '/'+this.state.path;
    // TODO some validation, maybe don't allow saving over other slugs
    let page = this.state;
    page.elements.forEach((element) => {
      if (typeof(element.props)=="string")
        element.props = JSON.parse(element.props);
    });
    BowAndDrape.api("POST", "/page", page, (err, result) => {
      if (err)
        return BowAndDrape.dispatcher.emit("error", err.error);
      location.reload();
    });
  }

  handleRemove() {
    if (!window.confirm('Delete page "'+this.state.path+'"?'))
      return;
    let page = this.state;
    BowAndDrape.api("DELETE", "/page", this.state, (err, result) => {
      if (err)
        return BowAndDrape.dispatcher.emit("error", err.error);
      location.reload();
    });
  }

  render() {
    let whitelisted_components = [];
    for (let i=0; i<this.props.whitelisted_components.length; i++) {
      whitelisted_components.push(<option key={whitelisted_components.length}>{this.props.whitelisted_components[i]}</option>);
    }

    let elements = [];
    for (let i=0; i<this.state.elements.length; i++) {
      let edit_props = null;
      switch (this.state.elements[i].type) {
        case "Gallery":
          edit_props = (
            <PageEditGallery onChange={this.handleUpdateProps.bind(this, i, "props")} {...this.state.elements[i].props}/>
          );
          break;
        case "Signup":
          edit_props = (
            <PageEditSignup onChange={this.handleUpdateProps.bind(this, i, "props")} {...this.state.elements[i].props}/>
          );
          break;
        case "TextContent":
          edit_props = (
            <PageEditTextContent onChange={this.handleUpdateProps.bind(this, i, "props")} {...this.state.elements[i].props}/>
          );
          break;
        case "Carousel":
          edit_props = (
            <PageEditCarousel onChange={this.handleUpdateProps.bind(this, i, "props")} {...this.state.elements[i].props}/>
          );
          break;
        default:
          edit_props = (
            <input type="text" name="props" style={{width:"100%"}} value={JSON.stringify(this.state.elements[i].props)} onChange={(event)=>{this.handleUpdateProps(i, "props", event.target.value)}}/>
          );
      }
      elements.push(
        <element key={elements.length}>
          <select value={this.state.elements[i].type} onChange={(event)=>{this.handleUpdateProps(i, "type", event.target.value)}} name="type">
            {whitelisted_components}
          </select>
          {edit_props}
          <span style={{cursor:"pointer",position:"absolute",right:"5px",top:"5px"}} className="remove" onClick={this.handleRemoveElement.bind(this, i)} title="delete">✘</span>
          <div className="reorder_actions" style={{position:"absolute",right:"30px",top:"5px",display:"flex",flexDirection:"column"}}>
            { (i>1) ?
              <span style={{cursor:"pointer"}} onClick={this.handleMoveElementTop.bind(this, i)} title="move to top">⇪</span>
              : null
            }
            { (i>0) ?
              <span style={{cursor:"pointer"}} onClick={this.handleMoveElementUp.bind(this, i)} title="move up">⇧</span>
              : null
            }
            { (i<this.state.elements.length-1) ?
              <span style={{cursor:"pointer"}} onClick={this.handleMoveElementDown.bind(this, i)} title="move down">⇩</span>
              : null
            }
          </div>
        </element>
      );
    }

    return (
      <page_edit>
        <label>path:</label><input type="text" onChange={(e)=>{this.setState({path:e.target.value});}} value={this.state.path} name="path"/>
        <a href={this.state.path} target="_blank" className="cta" style={{marginLeft:"30px"}}>preview</a>
        {elements}
        <element onClick={this.handleNewElement.bind(this)}>Add Element</element>
        <actions>
          <button onClick={this.handleSave.bind(this)}>{this.props.path?"Save":"Add New Page"}</button>
          {(this.props.path) ?
            <button onClick={this.handleRemove.bind(this)}>Delete</button>
            : null
          }
        </actions>
      </page_edit>
    )
  }
}
module.exports = PageEdit;
