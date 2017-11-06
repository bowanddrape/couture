
const React = require('react');

const Item = require('./Item.jsx');
const UserProfile = require('./UserProfile.jsx');
const Errors = require('./Errors.jsx');

/*
garment index garment id
left pad w/ zero's
shipment holds fulfillment_id, from_id, contents jsonb array

picking, pressing, QA, packing?
---
Then we need to set up the station views for each fulfillment station.
We probably want to add a bunch of links in the admin view (above the tabs)
that links to things like
href="/fulfillment/78f87a89-1bcb-4048-b6e5-68cf4ffcc53a/pick" and so on...
(and these will draw some FulfillmentStation view with a prop that's like
station="pick")

And then in the render function, draw the search box if you don't have a
shipment, draw the <Item fulfillment={true} {...this.state.shipment}/> as
well as a "done" button that when clicked grabs started and stopped time
and updates the shipment, appending it to a property in the corresponding
content_index (the payload you append should have the start, stop,
station_type, and user). You'll probably end up using jsonb_set() in
order to update the shipment, we haven't used it yet in our codebase so
there isn't an example I have to copy-paste you, so you'll need to use
google or read the docs.

need to add buttons and relevant information such as what station

*/
class FulfillmentStation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search: "216-",
      started: null,
      shipment: null,
    }
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    this.setState({
      [name]: value
    });
  }

  handleSearch() {
    Errors.clear();
    let product_tokens = this.state.search.split('-');
    if (product_tokens.length != 3)
      return Errors.emitError("lookup", "Invalid search parameters");
    // TODO use product_toks[0] to determine facility_id, hardcoded for now
    let from_id = '988e00d0-4b27-4ab4-ac00-59fcba6847d1'; // hardcoded "216"

    let fulfillment_id = product_tokens[1];
    let content_index = product_tokens[2];
    BowAndDrape.api("GET", "/shipment", {from_id, fulfillment_id}, (err, results) => {
      if (err){
        return Errors.emitError("lookup", err.toString());
      }

      if (results.length == 0){
        return Errors.emitError("lookup", "No garment found, check garment id");
      }

      // TODO handle invalid content index

      this.setState({
        shipment: results[0],
        started: new Date().getTime()/1000,
        content_index: content_index,
      });
    });
  }

  handleDone(add_tags, remove_tags) {
    // TODO also log metrics
    BowAndDrape.api("POST", "/shipment/tagcontent", {
      id: this.state.shipment.id,
      content_index: this.state.content_index-1,
      add_tags,
      remove_tags,
    }, (err, results) =>  {
      if (err) return Errors.emitError(err);
      this.setState({shipment:null});
    });
  }

  handleNextStep(state) {
    let remove_tags = [];
    switch (this.props.station) {
      case "picking":
        remove_tags.push("needs_picking");
        break;
      case "pressing":
        remove_tags.push("needs_pressing");
        break;
      case "qa-ing":
        remove_tags.push("needs_qa-ing");
        break;
      case "packing":
        remove_tags.push("needs_packing");
        break;
    };

    switch (state) {
      case "picking":
        return this.handleDone(["needs_picking"], remove_tags);
      case "pressing":
        return this.handleDone(["needs_pressing"], remove_tags);
      case "qa-ing":
        return this.handleDone(["needs_qa-ing"], remove_tags);
      case "packing":
        return this.handleDone(["needs_packing"], remove_tags);
    };
    this.handleDont([], []);
  }

  renderSearch() {
    return (
      <div>
        <label>Garment ID#:</label>
        <input
          type="text"
          value={this.state.search}
          onChange={this.handleInputChange}
          onKeyUp={(event)=>{if(event.which==13){this.handleSearch()}}}
          name="search"
        />
        <button onClick={this.handleSearch}>Lookup</button>
      </div>
    );
  }

  renderResults() {
    let actions = [];
    actions.push(<button key={actions.length} onClick={()=>{this.setState({shipment:null})}}>Cancel</button>);
    switch (this.props.station) {
      case "picking":
        actions.push(<button key={actions.length} onClick={this.handleNextStep.bind(this, "pressing")}>Mark for Pressing</button>);
        break;
      case "pressing":
        actions.push(<button key={actions.length} onClick={this.handleNextStep.bind(this, "qa-ing")}>Mark for QA-ing</button>);
        break;
      case "qa-ing":
        actions.push(<button key={actions.length} onClick={this.handleNextStep.bind(this, "packing")}>Mark for Packing</button>);
        actions.push(<button key={actions.length} onClick={this.handleNextStep.bind(this, "pressing")}>Mark for Re-Pressing</button>);
        actions.push(<button key={actions.length} onClick={this.handleNextStep.bind(this, "picking")}>Mark for Re-Picking</button>);
        break;
      case "packing":
        actions.push(<button key={actions.length} onClick={this.handleNextStep.bind(this, "shipping")}>Mark for Shipping</button>);
        break;
    };

    return (
      <div>
        <div className="items"><div className="product_wrapper">
          <Item fulfillment={true} content_index={this.state.content_index} garment_id={`216-${this.state.shipment.fulfillment_id}-${this.state.content_index}`} {...this.state.shipment.contents[this.state.content_index-1]}/>
        </div></div>
        {actions}
      </div>
    );
  }

  render() {
    let to_render = null;
    if (this.state.shipment) {
      to_render = this.renderResults();
    } else {
      to_render = this.renderSearch();
    }

    return (
      <div>
        <div style={{width:"200px",position:"absolute",right:0,backgroundColor:"#fff",border:"solid 1px #000", padding:"0 10px"}}>
          <UserProfile user={this.props.user}/>
        </div>
        <div style={{height:"86px"}} />
        <h1>{this.props.station}</h1>
        <Errors />
        <div className="fulfillmentStation">
          {to_render}
        </div>
      </div>
    );
  }
}

module.exports = FulfillmentStation;
