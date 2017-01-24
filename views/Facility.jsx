
const React = require('react');
const Shipment = require('./Shipment.jsx');
const Tabs = require('./Tabs.jsx');
const Scrollable = require('./Scrollable.jsx');

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
        <Tabs>
          <shipments>
            <h2>Pending Outbound Shipments</h2>
            <Scrollable
              component={Shipment}
              endpoint={`/shipment?from_id=${this.props.facility.id}&packed=null`}
              page = {{sort:"requested", direction:"ASC"}}
              data={this.props.pending_outbound_shipments}
            />
          </shipments>
          <shipments>
            <h2>For/In Transit</h2>
            <Scrollable
              component={Shipment}
              endpoint={`/shipment?from_id=${this.props.facility.id}&packed=not_null`}
              page = {{sort:"requested", direction:"ASC"}}
            />
          </shipments>
          <shipments>
            <h2>Completed</h2>
            <Scrollable
              component={Shipment}
              endpoint={`/shipment?from_id=${this.props.facility.id}&received=not_null`}
              page = {{sort:"received", direction:"DESC"}}
            />
          </shipments>
        </Tabs>
      </div>
    )
  }
}

module.exports = Facility;
