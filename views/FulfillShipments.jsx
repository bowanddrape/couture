
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

    this.state = {
      search_query: "",
    }
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
              component_props={{fulfillment:true}}
              endpoint={`/shipment?store_id=${this.props.store.id}&approved=null&on_hold=null&packed=null&received=null`}
              page = {{sort:"requested", direction:"ASC"}}
            />
          </shipments>
          <shipments>
            <h2>Hold</h2>
            <Scrollable
              component={Shipment}
              component_props={{fulfillment:true}}
              endpoint={`/shipment?store_id=${this.props.store.id}&approved=null&on_hold=not_null`}
              page = {{sort:"requested", direction:"DESC"}}
            />
          </shipments>
          <shipments>
            <h2>Picking</h2>
            <Scrollable
              component={Shipment}
              component_props={{fulfillment:true}}
              endpoint={`/shipment?store_id=${this.props.store.id}&approved=not_null&picked=null&packed=null&received=null`}
              page = {{sort:"requested", direction:"ASC", limit:100}}
            />
          </shipments>
          <shipments>
            <h2>Pressing</h2>
          </shipments>
          <shipments>
            <h2>Reviewing</h2>
            <Scrollable
              component={Shipment}
              component_props={{fulfillment:true}}
              endpoint={`/shipment?store_id=${this.props.store.id}&picked=not_null&inspected=null`}
              page = {{sort:"requested", direction:"ASC"}}
            />
          </shipments>
          <shipments>
            <h2>Packing</h2>
            <Scrollable
              component={Shipment}
              component_props={{fulfillment:true}}
              endpoint={`/shipment?store_id=${this.props.store.id}&inspected=not_null&packed=null`}
              page = {{sort:"requested", direction:"ASC"}}
            />
          </shipments>
          <shipments>
            <h2>Packed</h2>
            <Scrollable
              component={Shipment}
              component_props={{fulfillment:true}}
              endpoint={`/shipment?store_id=${this.props.store.id}&packed=not_null&ship_description=null`}
              page = {{sort:"requested", direction:"DESC"}}
            />
          </shipments>
          <shipments>
            <h2>Shipped</h2>
            <Scrollable
              component={Shipment}
              component_props={{fulfillment:true}}
              endpoint={`/shipment?store_id=${this.props.store.id}&ship_description=not_null&received=null`}
              page = {{sort:"requested", direction:"ASC"}}
            />
          </shipments>
          <shipments>
            <h2>Completed</h2>
            <Scrollable
              component={Shipment}
              component_props={{fulfillment:true}}
              endpoint={`/shipment?store_id=${this.props.store.id}&received=not_null`}
              page = {{sort:"received", direction:"DESC"}}
            />
          </shipments>
          <shipments>
            <h2>Search</h2>
            <input type="text" placeholder="search by id" value={this.state.search_query} onChange={(event)=>{this.setState({search_query:event.target.value})}}/>
            <Scrollable
              component={Shipment}
              component_props={{fulfillment:true}}
              endpoint={`/shipment?search=${this.state.search_query}`}
              page = {{sort:"requested", direction:"DESC"}}
            />
          </shipments>
        </Tabs>
      </div>
    )
  }
}

module.exports = FulfillShipments;
