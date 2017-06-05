
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
    return (
      <div>
        <h1>Store "{this.props.store.props.name}"</h1>
        <Tabs>
          <shipments>
            <h2>New</h2>
            <Scrollable
              component={Shipment}
              endpoint={`/shipment?store_id=${this.props.store.id}&approved=null&on_hold=null&packed=null&received=null`}
              page = {{sort:"requested", direction:"ASC"}}
            />
          </shipments>
          <shipments>
            <h2>Hold</h2>
            <Scrollable
              component={Shipment}
              endpoint={`/shipment?store_id=${this.props.store.id}&approved=null&on_hold=not_null`}
              page = {{sort:"requested", direction:"ASC"}}
            />
          </shipments>
          <shipments>
            <h2>For Production</h2>
            <Scrollable
              component={Shipment}
              component_props={{picklist:true}}
              endpoint={`/shipment?store_id=${this.props.store.id}&approved=not_null&in_production=null`}
              page = {{sort:"requested", direction:"ASC", limit:100}}
            />
          </shipments>
          <shipments>
            <h2>In Production</h2>
            <Scrollable
              component={Shipment}
              endpoint={`/shipment?store_id=${this.props.store.id}&in_production=not_null&packed=null`}
              page = {{sort:"requested", direction:"ASC"}}
            />
          </shipments>
          <shipments>
            <h2>Shipped</h2>
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
