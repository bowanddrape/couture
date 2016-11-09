
const React = require('react');

class Timestamp extends React.Component {
  render() {
    if (!this.props.time) return null;

    return (
      <span className="timestamp">
        {new Date(this.props.time*1000).toLocaleString()}
      </span>
    )
  }
}

module.exports = Timestamp;
