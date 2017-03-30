
const React = require('react');

class InputAddress extends React.Component {

  constructor(props) {
    super(props);

    this.handleFieldChange = this.handleFieldChange.bind(this);
    this.handleSetSectionState = this.props.handleSetSectionState;
  }

  componentDidMount() {
    this.initAutocomplete();
    BowAndDrape.dispatcher.on("loaded", this.initAutocomplete.bind(this));
  }

  initAutocomplete() {
    if (this.autocomplete) return;
    this.autocomplete = new google.maps.places.Autocomplete(
        (document.getElementById("address_autocomplete"+this.props.section_title.substring(0,4))),
        {types: ['geocode']});
    this.autocomplete.addListener('place_changed', () => {
      let place = autocomplete.getPlace();
      let parse_place = document.createElement("div");
      parse_place.innerHTML = place.adr_address;
      let place_fields = ["street-address", "locality", "region", "postal-code", "country-name"];
      let address = {};
      for (let i=0; i<place_fields.length; i++) {
        let element = parse_place.querySelector('.'+place_fields[i]);
        let key = place_fields[i].replace(/-.*/, "");
        if (element) address[key] = element.innerHTML;
      }
      this.handleSetSectionState(address);
    });
  }

  handleFieldChange(event) {
    let update = {};
    update[event.target.getAttribute("name")] = event.target.value;
    this.handleSetSectionState(update);
  }

  render() {
    return (
      <input_address>
        <section>{this.props.section_title}</section>
        {this.props.errors.length?<errors>{this.props.errors}</errors>:null}

        {this.props.section_title=="Shipping Address" ?
          <row><div>
            <label>Email</label>
            <input type="text" onChange={this.handleFieldChange} value={this.props.email} name="email"/>
          </div></row> : null
        }
        <row><div>
          <label>Name</label>
          <input type="text" onChange={this.handleFieldChange} value={this.props.name} name="name"/>
        </div></row>
        <row>
          <div>
            <label>Street Address</label>
            <input type="text" onChange={this.handleFieldChange} id={"address_autocomplete"+this.props.section_title.substring(0,4)} value={this.props.street} name="street"/>
          </div>
          <div>
            <label>Apt.</label>
            <input type="text" onChange={this.handleFieldChange} value={this.props.apt} name="apt"/>
          </div>
        </row><row>
          <div>
            <label>City</label>
            <input type="text" onChange={this.handleFieldChange} value={this.props.locality} name="locality"/>
          </div>
          <div>
            <label>State</label>
            <input type="text" onChange={this.handleFieldChange} value={this.props.region} name="region"/>
          </div>
          <div>
            <label>Zip</label>
            <input type="text" onChange={this.handleFieldChange} value={this.props.postal} name="postal"/>
          </div>
        </row><row>
          <div>
            <label>Country</label>
            <input type="text" onChange={this.handleFieldChange} value={this.props.country} name="country"/>
          </div>
        </row>

        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyB78i-bzVlKnAmv5j4YSQnKw7ODgvafNCQ&libraries=places"/>
      </input_address>
    );
  }
}
module.exports = InputAddress;
