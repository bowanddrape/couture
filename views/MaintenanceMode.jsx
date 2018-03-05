
const React = require('react');
const Placeholder = require('./Placeholder.jsx');

/***
Some warning message
***/
class MaintenanceMode extends React.Component {
  render() {
    return (
      <div className="warning">
        <div><b>JUST A SEC!</b></div>
        <div>We're doing a quick database backup and update</div>
        <div>It shouldn't take too long, check back in 10!</div>
        <Placeholder />
      </div>
    );
  }
}

module.exports = MaintenanceMode;
