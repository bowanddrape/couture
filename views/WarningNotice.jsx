
const React = require('react');
const Items = require('./Items.jsx');
const Signup = require('./Signup.jsx');

/***
Draw in the case of a 404
***/

class WarningNotice extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: this.props.message || [],
    }
  }

  render() {

    return (
      <div className="warning">
        <h1>{this.state.message}</h1>
      </div>
    );
  }
}


module.exports = WarningNotice;
