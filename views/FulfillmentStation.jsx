
const React = require('react');
const Item = require('./Item.jsx');
//const Items = require('./Items.jsx');

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
      station: this.props.station,
      shipment: null,
      shipExists: false,
    }
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.renderSearch = this.renderSearch.bind(this);
    this.renderResults = this.renderResults.bind(this);
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    this.setState({
      [name]: value
    });
  }

  handleSearch(){
    console.log("searching...");
    let product_tokens = this.state.search.split('-');
    if (product_tokens.length != 3)
      return "Invalid search parameters"
    // TODO use product_toks[0] to determine facility_id, hardcoded for now
    //let from_id = '78f87a89-1bcb-4048-b6e5-68cf4ffcc53a';
    let from_id = '988e00d0-4b27-4ab4-ac00-59fcba6847d1';
    //set id to whatever facility it came from

    let fulfillment_id = product_tokens[1];
    let content_index = product_tokens[2];
    BowAndDrape.api("GET", "/shipment", {from_id, fulfillment_id}, (err, results) => {
      if (err){
        console.log("ERROR");
        console.log(err);
        return(err);
      }
      console.log("Results:");
      console.log(results);

      if (results.length == 0){
        console.log("Nothing Returned");
        return;
      }

      this.setState({
        shipExists:true,
        shipment:results[0],
        started:new Date().getTime()/1000,
        content_index: content_index});
    });
  }

  renderSearch(){
    return (
      <div>
        <label>Order #:</label>
        <input
          type="text"
          value={this.state.search}
          onChange={this.handleInputChange}
          name="search"
        />
        <button onClick={this.handleSearch}>Search</button>
      </div>
    );
  }

  renderResults(){
    return (
      <div>
        <Item fulfillment={true} {...this.state.shipment.contents[this.state.content_index-1]}/>
      </div>
    );
  }

  render(){
    let toRender = false;
    if (this.state.shipExists == true) {
      toRender = this.renderResults();
    } else {
      toRender = this.renderSearch();
    }

    return(
      <div className="fulfillmentStation">
        {toRender}
      </div>
    );
  }
}

module.exports = FulfillmentStation;
