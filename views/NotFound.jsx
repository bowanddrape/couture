
const React = require('react');

/***
Contents of the 404 page
***/
class NotFound extends React.Component {
  render() {
    return (
      <div>
        <div>Resource Not Found!</div>
        <div>You may not have permissions to view this, in which case you should log out, log back in, then reload the page</div>
        <div>Or this page may simply not exist</div>
      </div>
    );
  }
}

module.exports = NotFound;
