
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

    return (
      <item className={this.props.props.image?"has_image":""}>
        <a href={this.props.props.url}>
          <preview style={{backgroundImage: "url("+this.props.props.image+")"}}/>
        </a>
        <deets>
          {/*<div className="sku">{this.props.sku}</div>*/}
          <a href={this.props.props.url}>
            <div className="name">{this.props.props.name}</div>
          </a>
          <div className="price">{this.props.props.price}$</div>
          {this.props.onRemove?<button className="remove" onClick={this.handleRemovePromptConfirm.bind(this)} onBlur={this.handleRemoveBlur}>Remove</button>:null}
        </deets>
        <assembly>
          {assembly}
        </assembly>
        {/*JSON.stringify(this.props.assembly)*/}
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
