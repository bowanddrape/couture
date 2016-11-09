
const React = require('react');
const Shipment = require('./Shipment.jsx');

class Facility extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let shipments = [];
    for (let i=0; i<this.props.shipments.length; i++) {
      let props = {};
      Object.assign(props, this.props.shipments[i]);
      props.key = i;
      shipments.push(
        React.createElement(Shipment, props)
      );
    }
    return (
      <div>
        {shipments}
      </div>
    )
  }
}

module.exports = Facility;
