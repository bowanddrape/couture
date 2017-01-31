
const React = require('react');
class Address extends React.Component {
  render() {
    return (
      <address>
        <street>{this.props.street_address}</street>
        <region>{this.props.region}{this.props.region?",":""}</region>
        <locality>{this.props.locality}</locality>
        <postal_code>{this.props.postal_code}</postal_code>
        <country>{this.props.country}</country>
      </address>
    );
  }
}

module.exports = Address;
