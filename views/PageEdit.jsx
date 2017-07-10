
const React = require('react');
const PageEditGallery = require("./PageEditGallery.jsx");
const PageEditSignup = require("./PageEditSignup.jsx");

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

  handleUpdateProps(index, name, value) {
    let elements = this.state.elements;
    elements[index][name] = value;
    this.setState({elements});
  }

  handleSave() {
    if (!this.state.path)
      return alert("please set a path");
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
        </element>
      );
    }

    return (
      <page_edit>
        <label>path:</label><input type="text" onChange={(e)=>{this.setState({path:e.target.value});}} value={this.state.path} name="path"/>
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
