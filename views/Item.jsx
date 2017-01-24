
const React = require('react');

class Item extends React.Component {
  render() {
    let picklist = [];
    for (let i=0; i<this.props.assembly.length; i++) {
      picklist.push(<img key={i} src={this.props.assembly[i].props.image} />);
    }

    return (
      <item>
        <deets>
          <img src={this.props.props.image}/>
          <div>{this.props.sku}</div>
          <div>{this.props.props.name}</div>
          <div>${this.props.props.price}</div>
          <div></div>
        </deets>
        <picklist>
          {picklist}
        </picklist>
        {/*JSON.stringify(this.props.assembly)*/}
      </item>
    )
  }
}

module.exports = Item;
