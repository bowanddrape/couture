
const React = require('react');

/***
Display a timestamp
props:
  time:# // epoch time in seconds
***/
class Timestamp extends React.Component {
  render() {

    return (
      <span className="timestamp">
        {this.props.time?new Date(this.props.time*1000).toLocaleString():null}
      </span>
    )
  }
}

module.exports = Timestamp;
