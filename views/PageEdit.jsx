
const React = require('react');

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

  handleUpdateElement(index, event) {
    let elements = this.state.elements;
    elements[index][event.target.getAttribute("name")] = event.target.value;
    try {
      elements[index][event.target.getAttribute("name")] = JSON.parse(event.target.value);
    } catch(err) {console.log(err);}
console.log(elements);
    this.setState({elements});
  }

  handleSave() {
    // TODO some validation, maybe don't allow saving over other slugs
    BowAndDrape.api("POST", "/page", this.state, (err, result) => {
      if (err)
        return BowAndDrape.dispatcher.emit("error", err.error);
console.log(result);
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
          <input type="text" name="props" value={JSON.stringify(this.state.elements[i].props)} onChange={this.handleUpdateElement.bind(this, i)}/>
          {JSON.stringify(this.state.elements[i])}
        </element>
      );
    }

    return (
      <page_edit>
        <label>path:</label><input type="text" onChange={(e)=>{this.setState({path:e.target.value});}} value={this.state.path} name="path"/>
        {elements}
        <element onClick={this.handleNewElement.bind(this)}>Add Element</element>
        <button onClick={this.handleSave.bind(this)}>{this.props.path?"Save":"Add New Page"}</button>
      </page_edit>
    )
  }
}
module.exports = PageEdit;
