
const React = require('react');
class Address extends React.Component {
  render() {
    return (
      <address style={{
        display: "block",
        fontFamily: "Arvo",
        fontSize: "13px",
        fontStyle: "normal",
      }}>
        <name style={{display:"block"}}>{this.props.name}</name>
        <street style={{display:"block"}}>{this.props.street}</street>
        <apt style={{display:"block"}}>{this.props.apt}</apt>
        <locality style={{display:"inline"}}>{this.props.locality}{this.props.locality?",":""}</locality>
        <region style={{display:"inline"}}>{this.props.region} </region>
        <postal style={{display:"inline"}}>{this.props.postal}</postal>
        <country style={{display:"block"}}>{this.props.country}</country>
      </address>
    );
  }
}

module.exports = Address;
