
const React = require('react');
const Shipment = require('./Shipment.jsx');
const Tabs = require('./Tabs.jsx');
const Scrollable = require('./Scrollable.jsx');

/***
Admin page to display list of orders at various states of shipment
***/
class FulfillShipments extends React.Component {
  constructor(props) {
    super(props);

    // make a global map of known facilities?
    if (typeof(BowAndDrape)!="undefined") {
      if(!BowAndDrape.facilities) {
        BowAndDrape.facilities = {};
      }
      BowAndDrape.facilities = this.props.facilities;
    }
  }

  componentDidMount() {
    // TODO listen on a websocket for updates to shipments that are made
    // while this page is open in a browser
  }

  render() {
    let pending_outbound_shipments = [];
    for (let i=0; i<this.props.pending_outbound_shipments.length; i++) {
      let props = {};
      Object.assign(props, this.props.pending_outbound_shipments[i]);
      props.key = i;
      pending_outbound_shipments.push(
        React.createElement(Shipment, props)
      );
    }
    return (
      <div>
        <h1>Store "{this.props.store.props.name}"</h1>
        <Tabs>
          <shipments>
            <h2>Pending Outbound Shipments</h2>
            <Scrollable
              component={Shipment}
              endpoint={`/shipment?store_id=${this.props.store.id}&packed=null&received=null`}
              page = {{sort:"requested", direction:"ASC"}}
              data={this.props.pending_outbound_shipments}
            />
          </shipments>
          <shipments>
            <h2>For/In Transit</h2>
            <Scrollable
              component={Shipment}
              endpoint={`/shipment?store_id=${this.props.store.id}&packed=not_null&received=null`}
              page = {{sort:"requested", direction:"ASC"}}
            />
          </shipments>
          <shipments>
            <h2>Completed</h2>
            <Scrollable
              component={Shipment}
              endpoint={`/shipment?store_id=${this.props.store.id}&received=not_null`}
              page = {{sort:"received", direction:"DESC"}}
            />
          </shipments>
        </Tabs>
      </div>
    )
  }
}

module.exports = FulfillShipments;
