
const React = require('react');

class ComponentEdit extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sku: "",
      name: "",
      price: "",
    }
  }

  handleFieldChange(event) {
    let update = {};
    if (section) {
      update[section] = this.state[section];
      update[section][event.target.getAttribute("name")] = event.target.value;
    }
    this.setState(update);
  }

  handleSave() {
    if (!this.state.sku) return alert("need to set sku");
  }

  render() {
    let fields = [];

    [
      {name:"sku",type:"text"},{name:"name",type:"text"},{name:"price",type:"text"}
    ].forEach((spec) => {
      if (spec.type=="text") 
        return fields.push(<div key={fields.length}>
          <label>{spec.name}:</label>
          <input type="text" onChange={this.handleFieldChange.bind(this)} value={this.state[spec.name]} name={spec.name}/>
        </div>);
    });


    return (
      <component_edit>
        {fields}
        <button onClick={this.handleSave.bind(this)}>{this.props.new?"New":"Save"}</button>
      </component_edit>
    );
  }
}

module.exports = ComponentEdit;
