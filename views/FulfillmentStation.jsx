
const React = require('react');

const Item = require('./Item.jsx');
const Shipment = require('./Shipment.jsx');
const UserProfile = require('./UserProfile.jsx');
const Errors = require('./Errors.jsx');


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
    if (product_tokens.length != 3 && this.props.station != "packing")
      return Errors.emitError("lookup", "Invalid search parameters");
    // TODO use product_toks[0] to determine facility_id, hardcoded for now
    let from_id = '988e00d0-4b27-4ab4-ac00-59fcba6847d1'; // hardcoded "216"

    let fulfillment_id = product_tokens[1];
    let content_index = 1;
    if (this.props.station != "packing"){
      content_index = product_tokens[2];
    }
    BowAndDrape.api("GET", "/shipment", {from_id, fulfillment_id}, (err, results) => {
      if (err){
        return Errors.emitError("lookup", err.toString());
      }

      if (results.length == 0){
        return Errors.emitError("lookup", "No garment found, check garment id");
      }
      // Handle wrong station events
      let tagValues = results[0].contents.map((garment) => {
        if (!garment.tags || !garment.tags.length)
          return false;
        if (garment.tags.indexOf("needs_"+this.props.station) >= 0)
          return true;
        return false;
      });

      let correctStation = tagValues[content_index-1];
      if (this.props.station == "packing"){
        let correctStation = tagValues.reduce(function(accumulator, currentValue) {
          return accumulator && currentValue;
        });
      }

      // TODO handle invalid content index
      this.setState({
        shipment: results[0],
        started: new Date().getTime()/1000,
        content_index: content_index,
        correctStation: correctStation,
      });
    });
  }

  handleDone(add_tags, remove_tags, ci) {
    // TODO also log metrics
    BowAndDrape.api("POST", "/shipment/tagcontent", {
      id: this.state.shipment.id,
      content_index: ci,
      add_tags,
      remove_tags,
    }, (err, results) =>  {
      if (err) return Errors.emitError(err);
      this.setState({shipment:null});
    });
  }

  handleNextStep(state) {
    let remove_tags = [];
    let index = this.state.content_index-1
    switch (this.props.station) {
      case "picking":
        remove_tags.push("needs_picking");
        break;
      case "pressing":
        remove_tags.push("needs_pressing");
        break;
      case "qaing":
        remove_tags.push("needs_qaing");
        break;
      case "packing":
        remove_tags.push("needs_packing");
        break;
    };

    switch (state) {
      case "picking":
        return this.handleDone(["needs_picking"], remove_tags, index);
      case "pressing":
        return this.handleDone(["needs_pressing"], remove_tags, index);
      case "qaing":
        return this.handleDone(["needs_qaing"], remove_tags, index);
      case "packing":
        return this.handleDone(["needs_packing"], remove_tags, index);
      case "shipping":
        return this.handleDone(["shipped"], remove_tags, "*");
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
    actions.push(<button key={actions.length} onClick={()=>{this.setState({shipment:null})}}>Back</button>);
    if (!this.state.correctStation){
      let view = [];
      if (this.props.station != "packing"){
        view.push(<Item fulfillment={true} key={view.length} content_index={this.state.content_index} garment_id={`216-${this.state.shipment.fulfillment_id}-${this.state.content_index}`} {...this.state.shipment.contents[this.state.content_index-1]}/>)
      }
      else {
        view.push(<Shipment key={view.length} fulfillment={true} {...this.state.shipment} />);
      }
      return (
        <div>
          <div className="warning404">
            <h2>ERROR: Incorrect Station</h2>
          </div>
            <div className="items">
              <div className="product_wrapper">
                {view}
          </div></div>
          {actions}
        </div>
      );
    }

    switch (this.props.station) {
      case "picking":
        actions.push(<button key={actions.length} onClick={this.handleNextStep.bind(this, "pressing")}>Mark for Pressing</button>);
        break;
      case "pressing":
        actions.push(<button key={actions.length} onClick={this.handleNextStep.bind(this, "qaing")}>Mark for QAing</button>);
        break;
      case "qaing":
        actions.push(<button key={actions.length} onClick={this.handleNextStep.bind(this, "packing")}>Mark for Packing</button>);
        actions.push(<button key={actions.length} onClick={this.handleNextStep.bind(this, "pressing")}>Mark for Re-Pressing</button>);
        actions.push(<button key={actions.length} onClick={this.handleNextStep.bind(this, "picking")}>Mark for Re-Picking</button>);
        break;
      case "packing":
        actions.push(<button key={actions.length} onClick={this.handleNextStep.bind(this, "shipping")}>Mark for Shipping</button>);
        break;
    };
    // Handle packing station view requirements
    let view = [];
    if (this.props.station == "packing") {
      view.push(<Shipment key={view.length} fulfillment={true} {...this.state.shipment} />);
    }
    else {
      view.push(<Item fulfillment={true} key={view.length} content_index={this.state.content_index} garment_id={`216-${this.state.shipment.fulfillment_id}-${this.state.content_index}`} {...this.state.shipment.contents[this.state.content_index-1]}/>);
    }
    return (
      <div>
        <div className="items"><div className="product_wrapper">
          {view}
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
