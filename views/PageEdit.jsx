
const React = require('react');
const Errors = require('./Errors.jsx');
const BADButton = require('./BADButton.jsx');
const PageEditGallery = require("./PageEditGallery.jsx");
const PageEditSignup = require("./PageEditSignup.jsx");
const PageEditTextContent = require("./PageEditTextContent.jsx");
const PageEditCarousel = require("./PageEditCarousel.jsx");
const PageEditHeroProduct = require("./PageEditHeroProduct.jsx");

/***
Admin widget for managing CMS pages
Called by PageList
***/
class PageEdit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      path: this.props.path,
      title: this.props.title || "",
      description: this.props.description || "",
      redirect: this.props.redirect || "",
      elements: this.props.elements,
      files: [],
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
    elements.splice(index+1, 0, moved[0]);
    this.setState({elements});
  }

  handleUpdateProps(index, name, value) {
    let elements = this.state.elements;
    elements[index][name] = value;
    this.setState({elements});
  }

  handleUpdateFile(file) {
    this.setState((prev_state) => {
      let files = prev_state.files.slice(0);
      files.push(file);
      return {files};
    });
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
    this.state.files.forEach((file) => {
      page["file_"+file.name.replace(/ /g,"")] = file;
    });
    BowAndDrape.api("POST", "/page", page, (err, result) => {
      if (err) {
        return Errors.emitError(null, err);
      }
      location.reload();
    });
  }

  handleRemove() {
    if (!window.confirm('Delete page "'+this.state.path+'"?'))
      return;
    let page = this.state;
    BowAndDrape.api("DELETE", "/page", this.state, (err, result) => {
      if (err)
        return Errors.emitError(null, err);
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
            <PageEditGallery onFileUpload={this.handleUpdateFile.bind(this)} onChange={this.handleUpdateProps.bind(this, i, "props")} {...this.state.elements[i].props}/>
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
        case "HeroProduct":
          edit_props = (
            <PageEditHeroProduct onChange={this.handleUpdateProps.bind(this, i, "props")} {...this.state.elements[i].props}/>
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
          <span style={{cursor:"pointer",position:"absolute",right:"5px",top:"5px"}} className="remove" onClick={this.handleRemoveElement.bind(this, i)} title="delete">{'✘'}</span>
          <div className="reorder_actions" style={{position:"absolute",right:"30px",top:"5px",display:"flex",flexDirection:"column"}}>
            { (i>1) ?
              <span style={{cursor:"pointer"}} onClick={this.handleMoveElementTop.bind(this, i)} title="move to top">{'⇪'}</span>
              : null
            }
            { (i>0) ?
              <span style={{cursor:"pointer"}} onClick={this.handleMoveElementUp.bind(this, i)} title="move up">{'⇧'}</span>
              : null
            }
            { (i<this.state.elements.length-1) ?
              <span style={{cursor:"pointer"}} onClick={this.handleMoveElementDown.bind(this, i)} title="move down">{'⇩'}</span>
              : null
            }
          </div>
        </element>
      );
    }

    return (
      <div className="page_edit">
        <label>path:</label><input type="text" onChange={(e)=>{this.setState({path:e.target.value});}} value={this.state.path} name="path"/>
        <label>title:</label><input type="text" onChange={(e)=>{this.setState({title:e.target.value});}} value={this.state.title} name="title"/>
        <label>description:</label><input type="text" onChange={(e)=>{this.setState({description:e.target.value});}} value={this.state.description} name="description"/>
        <label>redirect:</label><input type="text" onChange={(e)=>{this.setState({redirect:e.target.value});}} value={this.state.redirect} name="redirect"/>
        <a href={this.state.path} target="_blank" className="cta" style={{marginLeft:"30px"}}>preview</a>
        {elements}
        <element onClick={this.handleNewElement.bind(this)}>Add Element</element>
        <div className="actions">
          <Errors />
          <BADButton onClick={this.handleSave.bind(this)}>{this.props.path?"Save":"Add New Page"}</BADButton>
          {(this.props.path) ?
            <button onClick={this.handleRemove.bind(this)}>Delete</button>
            : null
          }
        </div>
      </div>
    )
  }
}
module.exports = PageEdit;
