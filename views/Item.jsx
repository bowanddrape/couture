
const React = require('react');

let recurse_assembly = (component, foreach) => {
  if (!component) return;
  foreach(component);
  if (component.assembly) {
    component.assembly.forEach((component) => {
      recurse_assembly(component, foreach);
    });
  }
}

/***
Draw an Item. Used in views/Items.jsx
props: will mirror a Component model
***/
class Item extends React.Component {
  render() {
    if (!this.props.props) {
      return (
        <item>{JSON.stringify(this.props)}</item>
      );
    }
    let assembly = [];
    if (this.props.picklist && this.props.assembly) {
      for (let i=0; i<this.props.assembly.length; i++) {
        let assembly_row = [];
        recurse_assembly(this.props.assembly[i], (component) => {
          if (component.props && component.props.image && component.text)
            assembly_row.push(<span key={assembly_row.length}><img src={component.props.image}/>{component.text}</span>);
          else if (component.props && component.props.image)
            assembly_row.push(<img key={assembly_row.length} src={component.props.image} />);
          else if (!component.assembly)
            assembly_row.push(<span key={assembly_row.length}>{JSON.stringify(component)}</span>);
        });
        assembly.push(<div key={assembly.length}>{assembly_row}</div>);
      }
    }

    return (
      <item className={this.props.props.image?"has_image":""}>
        <a href={this.props.props.url}>
          <img className="preview" src={this.props.props.image}/>
        </a>
        <deets>
          {/*<div className="sku">{this.props.sku}</div>*/}
          <a href={this.props.props.url}>
            <div className="name">{this.props.props.name}</div>
          </a>
          <div className="price">{this.props.props.price?this.props.props.price+"$":"Free!"}</div>
          {this.props.onRemove?<button className="remove" onClick={this.handleRemovePromptConfirm.bind(this)} onBlur={this.handleRemoveBlur}>Remove</button>:null}
        </deets>
        <assembly>
          {assembly}
          {/*JSON.stringify(this.props.assembly)*/}
        </assembly>
      </item>
    )
  }

  handleRemovePromptConfirm(event) {
    event.stopPropagation();
    if (event.target.innerHTML=="Are you sure?") {
      this.handleRemoveBlur(event);
      return this.props.onRemove();
    }
    event.target.classList.add("confirm");
    event.target.innerHTML = "Are you sure?";
  }
  handleRemoveBlur(event) {
    event.target.classList.remove("confirm");
    event.target.innerHTML = "Remove";
  }
}

module.exports = Item;
