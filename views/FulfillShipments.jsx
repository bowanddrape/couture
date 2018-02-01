
const React = require('react');
const async = require('async');
const Shipment = require('./Shipment.jsx');
const Tabs = require('./Tabs.jsx');
const Scrollable = require('./Scrollable.jsx');
const FulfillmentStickers = require('./FulfillmentStickers.jsx');

/***
Admin page to display list of orders at various states of shipment
***/
const tagged_tabs = ["new", "needs_airbrush", "needs_embroidery", "at_airbrush", "at_embroidery", "needs_stickers", "needs_picking", "needs_pressing", "needs_qaing", "needs_packing", "on_hold", "anna", "remake", "return", "open_return", "canceled"];

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

  static preprocessProps(options, callback) {
    const SQLTable = require('../models/SQLTable.js');
    const Facility = require('../models/Facility');
    // get late shipments
    SQLTable.sqlQuery(null, "SELECT shipments.* FROM (WITH shipment_contents AS (SELECT *, jsonb_array_elements(contents) AS content_array FROM shipments WHERE ship_by<date_part('epoch',NOW()) AND to_id!='e03d3875-d349-4375-8071-40928aa625f5') SELECT id, count(1) AS count, string_agg(content_array#>>'{tags}',' ') AS tags FROM shipment_contents WHERE content_array->'sku' IS NOT NULL GROUP BY id) AS s, shipments WHERE s.count<>(CHAR_LENGTH(s.tags)-CHAR_LENGTH(REPLACE(s.tags, 'shipped', '')))/CHAR_LENGTH('shipped') AND shipments.id=s.id", [], (err, result) => {
      options.late = [];
      if (result && result.rows)
        options.late = result.rows;

      // get shipments about to be late
      SQLTable.sqlQuery(null, "SELECT shipments.* FROM (WITH shipment_contents AS (SELECT *, jsonb_array_elements(contents) AS content_array FROM shipments WHERE ship_by-86400<date_part('epoch',NOW()) AND ship_by>date_part('epoch',NOW()) AND to_id!='e03d3875-d349-4375-8071-40928aa625f5') SELECT id, count(1) AS count, string_agg(content_array#>>'{tags}',' ') AS tags FROM shipment_contents WHERE content_array->'sku' IS NOT NULL GROUP BY id) AS s, shipments WHERE s.count<>(CHAR_LENGTH(s.tags)-CHAR_LENGTH(REPLACE(s.tags, 'shipped', '')))/CHAR_LENGTH('shipped') AND shipments.id=s.id", [], (err, result) => {
        options.ship_today = [];
        if (result && result.rows)
          options.ship_today = result.rows;

        // get count of shipped items
        SQLTable.sqlQuery(null, "WITH shipment_contents AS (SELECT *, jsonb_array_elements(contents) AS content_array FROM shipments WHERE to_id!='e03d3875-d349-4375-8071-40928aa625f5') SELECT count(1) as count FROM shipment_contents WHERE content_array->'tags' ? 'shipped'", [], (err, result) => {
          if (result && result.rows && result.rows.length)
            options.shipped_count = result.rows[0].count;

          // get facilities
          Facility.getAll({}, (err, facility_list) => {
            if (err || !facility_list.length)
              return Page.renderNotFound(req, res);
            // convert facilities list to array
            options.facilities = {};
            facility_list.map((facility) => {
              options.facilities[facility.id] = facility;
            });
            callback(null, options);
          }); // get facilities
        }); // get shipped count
      }); // get about-to-be-late shipments
    }); // get late shipments
  }

  componentDidMount() {
    // TODO listen on a websocket for updates to shipments that are made
    // while this page is open in a browser

    this.refreshTaggedShipments();
  }

  refreshTaggedShipments() {
    if (!BowAndDrape) return;
    tagged_tabs.forEach((tag) => {
      let tag_name = tag;
      BowAndDrape.api("GET", "/shipment/tagged/", {tag:tag_name}, (err, shipments) => {
        if (err) return Errors.emitError(null, err);
        this.setState({[tag.replace(/-/g,"")]:shipments});
      });
    });
  }

  handleMarkStickersPrinted() {
    let api_calls = this.state.needs_stickers.map((shipment) => {
      return (callback) => {
        BowAndDrape.api("POST", "/shipment/tagcontent", {
          id: shipment.id,
          content_index: "*",
          add_tags: ["needs_picking","sticker printed"],
          remove_tags: ["needs_stickers"],
        }, callback);
      };
    });
    async.parallel(api_calls, (err, results) => {
      if (err) return alert("error: "+err);
      this.refreshTaggedShipments();
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
        <div className="station_links">
          Fulfillment Stations: <span>{station_links}</span>
        </div>
      )
    }

    let tagged_tab_contents = [];
    tagged_tabs.forEach((tag) => {
      // seperate handling for some states
      if (["needs_stickers"].indexOf(tag)>=0) {
        return tagged_tab_contents.push(
          <shipments key={tag} className="fulfillment_stickers" name={tag+" "+this.state.needs_stickers.length}>
            <h2>{tag}</h2>
            <div className="action_bar">
              <button onClick={this.handleMarkStickersPrinted.bind(this)}>
                Done printing
              </button>
            </div>
            <FulfillmentStickers shipments={this.state.needs_stickers} />
          </shipments>
        );
      }

      let tab_contents = [];
      this.state[tag.replace(/-/g,"")].forEach((shipment, index) => {
        // ignore dupe shipments
        if (this.state[tag.replace(/-/g,"")].findIndex((s)=>{return s.id==shipment.id})!=index) return;
        tab_contents.push(
          <Shipment key={shipment.id} fulfillment={true} edit_tags={true} {...shipment} />
        );
      });
      tagged_tab_contents.push(
        <shipments key={tagged_tab_contents.length} name={tag+" "+this.state[tag.replace(/-/g,"")].length}>
          <h2>{tag}</h2>
          {tab_contents}
        </shipments>
      );
    });

    let late = []
    if (this.props.late) {
      this.props.late.forEach((shipment) => {
        late.push(
          <Shipment key={shipment.id} fulfillment={true} edit_tags={true} {...shipment} />
        );
      });
    }

    let ship_today = []
    if (this.props.ship_today) {
      this.props.ship_today.forEach((shipment) => {
        ship_today.push(
          <Shipment key={shipment.id} fulfillment={true} edit_tags={true} {...shipment} />
        );
      });
    }

    return (
      <div className="fulfillment_admin">
        <h1>Store "{this.props.store.props.name}"</h1>
        {fulfillment_stations}
        <Tabs onChange={this.refreshTaggedShipments.bind(this)}>
          {tagged_tab_contents}
          <shipments>
            <h2>{`Ship Today ${ship_today.length}`}</h2>
            {ship_today}
          </shipments>
          <shipments>
            <h2>{`Late ${late.length}`}</h2>
            {late}
          </shipments>
          <shipments>
            <h2>{`Shipped ${this.props.shipped_count}`}</h2>
            <Scrollable
              component={Shipment}
              component_props={{fulfillment:true,edit_tags:true}}
              endpoint={`/shipment/tagged?tag=shipped`}
              page = {{sort:"ship_by", direction:"ASC"}}
            />
          </shipments>
          <shipments>
            <h2>In Transit</h2>
            <Scrollable
              component={Shipment}
              component_props={{fulfillment:true,edit_tags:true}}
              endpoint={`/shipment?store_id=${this.props.store.id}&ship_description=not_null&received=null`}
              page = {{sort:"ship_by", direction:"ASC"}}
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
            <h2>All</h2>
            <Scrollable
              component={Shipment}
              component_props={{fulfillment:true,edit_tags:true}}
              endpoint={`/shipment?store_id=${this.props.store.id}`}
              page = {{sort:"ship_by", direction:"DESC"}}
            />
          </shipments>
          <shipments>
            <h2>Search</h2>
            <input type="text" placeholder="search by id" value={this.state.search_query} onChange={(event)=>{this.setState({search_query:event.target.value})}}/>
            <Scrollable
              component={Shipment}
              component_props={{fulfillment:true,edit_tags:true}}
              endpoint={`/shipment?search=${this.state.search_query}`}
              page = {{sort:"ship_by", direction:"DESC"}}
            />
          </shipments>
        </Tabs>
      </div>
    )
  }
}

module.exports = FulfillShipments;
