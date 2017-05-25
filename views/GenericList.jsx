
const React = require('react');

/***
A raw display helper used by some admin models.
No react handlers or bindings allowed here aside from render() and
componentWillMount() as this rendered server side only
***/
class GenericList extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let children = [];
    for (let i=0; i<this.props.data.length; i++) {
      let props = {};
      Object.assign(props, this.props.data[i]);
      props.key = i;
      children.push(
        <a key={children.length} className="button" href={this.props.data[i].href}>
          {this.props.data[i].props?this.props.data[i].props.name:this.props.data[i].id}
        </a>
      );
    }

    return (
      <div>
        <h2>{this.props.title}</h2>
        {children}
      </div>
    );
  }
}
module.exports = GenericList;
