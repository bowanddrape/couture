
const React = require('react');
const Shipment = require('./Shipment.jsx');
const Tabs = require('./Tabs.jsx');
const Scrollable = require('./Scrollable.jsx');
const FulfillmentStickers = require('./FulfillmentStickers.jsx');

/***
Admin page to display list of orders at various states of shipment
***/
const tagged_tabs = ["stickering","picking", "pressing", "qa-ing", "packing"];

class FulfillShipments extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      search_query: "",
    }
    tagged_tabs.forEach((tag) => {
      this.state[tag.replace(/-/g, "")] = [];
    });
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

    this.refreshTaggedShipments();
  }

  refreshTaggedShipments() {
    if (!BowAndDrape) return;
    // FIXME facility_id hardcoded for now
    let from_id = '988e00d0-4b27-4ab4-ac00-59fcba6847d1';
    tagged_tabs.forEach((tag) => {
      BowAndDrape.api("GET", "/shipment/tagged/", {tag:"needs_"+tag, from_id}, (err, shipments) => {
        if (err) return Errors.emitError(null, err);
        this.setState({[tag.replace(/-/g,"")]:shipments});
      });
    });
  }

  render() {
    let fulfillment_stations = null;
    if (typeof(window)!="undefined" && this.props.station_types) {
      let station_links = [];
      this.props.station_types.forEach((station_type) => {
        station_links.push(
          <a key={station_links.length} className="cta" style={{marginLeft:"10px"}} href={window.location.pathname+'/'+station_type}>{station_type}</a>
        );
      });
      fulfillment_stations = (
        <div>
          Fullfillment Stations: <span>{station_links}</span>
        </div>
      )
    }

    let tagged_tab_contents = [];
    tagged_tabs.forEach((tag) => {
      // seperate handling for some states
      if (["stickering"].indexOf(tag)>=0) return;

      let tab_contents = [];
      this.state[tag.replace(/-/g,"")].forEach((shipment, index) => {
        // ignore dupe shipments
        if (this.state[tag.replace(/-/g,"")].findIndex((s)=>{return s.id==shipment.id})!=index) return;
        tab_contents.push(
          <Shipment key={tab_contents.length} fulfillment={true} edit_tags={true} {...shipment} />
        );
      });
      tagged_tab_contents.push(
        <shipments key={tagged_tab_contents.length} name={tag+" "+this.state[tag.replace(/-/g,"")].length}>
          <h2>{tag}</h2>
          {tab_contents}
        </shipments>
      );
    });

    return (
      <div>
        <h1>Store "{this.props.store.props.name}"</h1>
        {fulfillment_stations}
        <Tabs onChange={this.refreshTaggedShipments.bind(this)}>
          <shipments>
            <h2>New</h2>
            <Scrollable
              component={Shipment}
              component_props={{fulfillment:true,edit_tags:true}}
              endpoint={`/shipment?store_id=${this.props.store.id}&approved=null&on_hold=null&packed=null&received=null`}
              page = {{sort:"requested", direction:"ASC"}}
            />
          </shipments>
          <shipments>
            <h2>Hold</h2>
            <Scrollable
              component={Shipment}
              component_props={{fulfillment:true,edit_tags:true}}
              endpoint={`/shipment?store_id=${this.props.store.id}&approved=null&on_hold=not_null`}
              page = {{sort:"requested", direction:"DESC"}}
            />
          </shipments>
{/* TODO do this
          <shipments name={"Needs Stickers"+this.state.stickering.length}>
            <h2>Needs Stickers</h2>
            <FulfillmentStickers shipments={this.state.stickering} />
          </shipments>
*/}
          {tagged_tab_contents}
          <shipments>
            <h2>Packed</h2>
            <Scrollable
              component={Shipment}
              component_props={{fulfillment:true,edit_tags:true}}
              endpoint={`/shipment?store_id=${this.props.store.id}&packed=not_null&ship_description=null`}
              page = {{sort:"requested", direction:"DESC"}}
            />
          </shipments>
          <shipments>
            <h2>Shipped</h2>
            <Scrollable
              component={Shipment}
              component_props={{fulfillment:true,edit_tags:true}}
              endpoint={`/shipment?store_id=${this.props.store.id}&ship_description=not_null&received=null`}
              page = {{sort:"requested", direction:"ASC"}}
            />
          </shipments>
          <shipments>
            <h2>Completed</h2>
            <Scrollable
              component={Shipment}
              component_props={{fulfillment:true,edit_tags:true}}
              endpoint={`/shipment?store_id=${this.props.store.id}&received=not_null`}
              page = {{sort:"received", direction:"DESC"}}
            />
          </shipments>
          <shipments>
            <h2>Search</h2>
            <input type="text" placeholder="search by id" value={this.state.search_query} onChange={(event)=>{this.setState({search_query:event.target.value})}}/>
            <Scrollable
              component={Shipment}
              component_props={{fulfillment:true,edit_tags:true}}
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
