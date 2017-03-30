
const React = require('react');

class Item extends React.Component {
  render() {
    if (!this.props.props) {
      return (
        <item>{JSON.stringify(this.props)}</item>
      );
    }
    let assembly = [];
    if (this.props.assembly) {
      for (let i=0; i<this.props.assembly.length; i++) {
        if (this.props.assembly[i].props) {
          assembly.push(<img key={i} src={this.props.assembly[i].props.image} />);
        }
        else
          assembly.push(<span key={i}>{this.props.assembly[i].sku} </span>);
      }
    }

    let other_properties = [];
    for (let prop in this.props.props) {
      if (prop=="image" || prop=="name") continue;
      other_properties.push(<div key={other_properties.length}><label>{prop}:</label> <value>{this.props.props[prop]}</value></div>);
    }

    return (
      <item>
        <deets>
          {this.props.props.image ?
            <preview style={{backgroundImage: "url("+this.props.props.image+")"}}/>
            : <preview className="disabled" />
          }
          {/*<div className="sku">{this.props.sku}</div>*/}
          <div className="name">{this.props.props.name}</div>
          <props>{other_properties}</props>
        </deets>
        {this.props.onRemove?<remove onClick={this.props.onRemove}>X</remove>:null}
        <assembly>
          {assembly}
        </assembly>
        {/*JSON.stringify(this.props.assembly)*/}
      </item>
    )
  }
}

module.exports = Item;
