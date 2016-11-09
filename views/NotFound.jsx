
const React = require('react');
const LayoutMain = require('./LayoutMain');

class NotFound extends React.Component {
  render() {
    return (
      React.createElement(LayoutMain, {content:"Not Found"})
    );
  }
}

module.exports = NotFound;
