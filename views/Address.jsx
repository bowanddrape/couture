
const React = require('react');
class Address extends React.Component {
  render() {
    return (
      <address>
        <street>{this.props.street}</street>
        <apt>{this.props.apt}</apt>
        <locality>{this.props.locality}{this.props.locality?",":""}</locality>
        <region>{this.props.region}</region>
        <postal>{this.props.postal}</postal>
        <country>{this.props.country}</country>
      </address>
    );
  }
}

module.exports = Address;
