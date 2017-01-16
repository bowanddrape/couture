
const React = require('react');
const Shipment = require('./Shipment.jsx');

class Facility extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let pending_outbound_shipments = [];
    for (let i=0; i<this.props.pending_outbound_shipments.length; i++) {
      let props = {};
      Object.assign(props, this.props.pending_outbound_shipments[i]);
      props.key = i;
      props.facilities = this.props.facilities;
      pending_outbound_shipments.push(
        React.createElement(Shipment, props)
      );
    }
    return (
      <div>
        <h1>Facility "{this.props.facility.props.name}"</h1>
        <shipments>
          <h2>Pending Outbound Shipments</h2>
          <div id="pending_outbound_shipments">
            {pending_outbound_shipments}
          </div>
        </shipments>
      </div>
    )
  }
}

module.exports = Facility;
