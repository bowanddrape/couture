
const React = require('react');

class ComponentEdit extends React.Component {
  constructor(props) {
    super(props);

    this.state = JSON.parse(JSON.stringify(this.props));
    delete this.state.inherits;
  }

  handleFieldChange(event) {
    let name_toks = event.target.getAttribute("name").split('_');
    let update = {};
    update[name_toks.pop()] = event.target.value;
    while (name_toks.length) {
      let updated = {};
      updated[name_toks.pop()] = update;
      update = updated;
    }
    this.setState(update);
  }

  handleFileChange(event) {
    this.file = event.target.files[0];
  }

  handleSave() {
    if (!this.state.sku) return alert("need to set sku");
    let payload = this.state;
    if (this.file)
      payload.image_file = this.file;
    BowAndDrape.api("POST", `/component`, payload, (err, result) => {
      if (err) return console.log(err);
      location.reload();
    });
  }

  componentWillReceiveProps(nextProps) {
    // ensure we clear previous state
    let props = {};
    props.options = props.options || {};
    props.props = props.props || {};
    props.compatible_components = props.compatible_components || [];
    props.sku = props.sku || "";
    this.setState(props);
  }

  render() {
    let fields = [];

    [
      {name:"sku",type:"text"},{name:"props_name",type:"text"},{name:"props_price",type:"text"},{name:"props_image",type:"file"}
    ].forEach((spec) => {
      // use underscores to navigate child fields
      let name_toks = spec.name.split('_');
      let value = this.state[name_toks[0]] || "";
      let placeholder = this.props.inherits[name_toks[0]] || "";
      for (let i=1; i<name_toks.length; i++ ) {
        if (value)
          value = value[name_toks[i]] || "";
        if (placeholder)
          placeholder = placeholder[name_toks[i]] || "";
      }

      if (spec.type=="text") 
        return fields.push(<div key={fields.length}>
          <label>{spec.name}:</label>
          <input type="text" onChange={this.handleFieldChange.bind(this)} value={value} placeholder={placeholder} name={spec.name}/>
        </div>);
      if (spec.type=="file")
        return fields.push(<div key={fields.length}>
          <label>{spec.name}({value?"set":"inherited"}):</label>
          <input type="file" onChange={this.handleFileChange.bind(this)} value={value} placeholder={placeholder} name={spec.name}/>
        </div>);
    });


    return (
      <component_edit>
        {fields}
        <button onClick={this.handleSave.bind(this)}>Save</button>
        {this.props.children}
      </component_edit>
    );
  }
}

module.exports = ComponentEdit;
