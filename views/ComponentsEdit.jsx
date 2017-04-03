
const React = require('react');

const ComponentEdit = require('./ComponentEdit.jsx');

class ComponentsEdit extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      components: [],
    }
  }

  handleFilter(event) {
    if (this.querying) return;
    this.querying = true;

    let query = event.target.value;
    BowAndDrape.api('GET', `/component?search=${query}&page={"limit":20}`, null, (err, components) => {
console.log(components);
      this.setState({components});
      this.querying = false;
    });
  }

  render() {
    let components = [];
    this.state.components.forEach((component) => {
      components.push(<ComponentEdit key={components.length} {...component} />);
    });
    return (
      <div>
        <input type="text" placeholder="filter" onChange={this.handleFilter.bind(this)} />
        {components}
        <ComponentEdit key={components.length+1} new={true} />
      </div>
    );
  }
}

module.exports = ComponentsEdit;
