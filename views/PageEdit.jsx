
const React = require('react');

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
    this.state.elements.forEach((element) => {
      element.props = JSON.stringify(element.props);
    });
  }

  handleNewElement() {
    let elements = this.state.elements;
    elements.push({type:"",props:{}});
    this.setState({elements});
  }

  handleUpdateElement(index, event) {
    let elements = this.state.elements;
    elements[index][event.target.getAttribute("name")] = event.target.value;
    this.setState({elements});
  }

  handleSave() {
    if (!this.state.path)
      return alert("please set a path");
    // TODO some validation, maybe don't allow saving over other slugs
    let page = this.state;
    page.elements.forEach((element) => {
      element.props = JSON.parse(element.props);
    });
    BowAndDrape.api("POST", "/page", this.state, (err, result) => {
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
      elements.push(
        <element key={elements.length}>
          <select value={this.state.elements[i].type} onChange={this.handleUpdateElement.bind(this, i)} name="type">
            {whitelisted_components}
          </select>
          <input type="text" name="props" value={this.state.elements[i].props} onChange={this.handleUpdateElement.bind(this, i)}/>
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
