
const React = require('react');

class ComponentEdit extends React.Component {
  constructor(props) {
    super(props);

    this.state = JSON.parse(JSON.stringify(this.props));
    delete this.state.inherits;
  }

  handleFieldChange(event) {
    let update = {};
    let name = event.target.getAttribute("name");
    let name_toks = name.split('_');
    if (name_toks.length==1) {
      update[name] = event.target.value;
      return this.setState(update);
    }

    let key;
    key = name_toks.shift();
    let prev_state = JSON.parse(JSON.stringify(this.state));
    update[key] = prev_state[key] || {};
    let update_pointer = update[key];
    while (true) {
      key = name_toks.shift();
      if (!name_toks.length) {
        update_pointer[key] = event.target.value;
        break;
      }
      update_pointer[key] = update_pointer[key] || {};
      update_pointer = update_pointer[key];
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
    props.options = nextProps.options || {};
    props.props = nextProps.props || {};
    props.compatible_components = nextProps.compatible_components || [];
    props.sku = nextProps.sku || "";
    this.setState(props);
  }

  render() {
    let fields = [];

    [
      {name:"sku",type:"readonly"},
      {name:"props_name",type:"text"},
      {name:"props_price",type:"text"},
      {name:"props_imagewidth", type:"text"},
      {name:"props_imageheight", type:"text"},
      {name:"props_image",type:"file"},
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


      if (spec.type=="readonly")
        return fields.push(<div key={fields.length}>
          <label>{spec.name}</label>
          <input type="text" value={value} placeholder={placeholder} name={spec.name} disabled={true}/>
        </div>);
      if (spec.type=="text")
        return fields.push(<div key={fields.length}>
          <label>{spec.name}</label>
          <input type="text" onChange={this.handleFieldChange.bind(this)} value={value} placeholder={placeholder} name={spec.name}/>
        </div>);
      if (spec.type=="file") {
        return fields.push(<div key={fields.length}>
          <label>{spec.name}({value?"set":"inherited"})</label>
          <input type="file" onChange={this.handleFileChange.bind(this)} placeholder={placeholder} name={spec.name}/>
        </div>);
      }
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
