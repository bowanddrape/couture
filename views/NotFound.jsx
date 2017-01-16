
const React = require('react');
const LayoutMain = require('./LayoutMain');

class NotFound extends React.Component {
  render() {
    return (
      React.createElement(LayoutMain, {content:`
        <div>Resource Not Found!</div>
        <div>You may not have permissions to view this, in which case you should log out, log back in, then reload the page</div>
        <div>Or this page may simply not exist</div>
      `})
    );
  }
}

module.exports = NotFound;
