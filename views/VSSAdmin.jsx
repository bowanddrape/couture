const React = require('react');

/***
Draws the Virtual Sample Sale Admin page.
***/

class VSSAdmin extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        sku: '',
        props: {
          name: '',
          price: '',
          size: '',
        },
      };
    }

    handleSKU(event){
      let update = {};
      update[event.target.getAttribute("name")] = event.target.value;
      this.setState(update);
    }

    handleChange(section, event) {
      let update = {};
      if (section) {
        update[section] = this.state[section];
        update[section][event.target.getAttribute("name")] = event.target.value;
      }
      this.setState(update);
    }

    handleSubmit() {
      BowAndDrape.api("POST", "/vss", this.state, (err, resp) => {
        if (err) {
          alert("Error on POSTing");
          return this.handleSetSectionState("card", {errors: [err.error]});
        }
        let querySKU = resp.shipment.contents[0].sku;
        let redirectURL = "/vss?sku=" + querySKU;
        //redirect to cart url
        location.href = redirectURL;
      });
    }

    render() {
      return(
        <div>
          <section>New VSS Item</section>
          <row><div>
            <label>SKU:</label>
            <input
              type="text"
              onChange={this.handleSKU.bind(this)}
              value={this.state.sku}
              name="sku"
            />
          </div></row>
          <row><div>
            <label>Name:</label>
            <input
              type="text"
              onChange={this.handleChange.bind(this, "props")}
              value={this.state.props.name}
              name="name"
            />
          </div></row>
          <row><div>
            <label>Size:</label>
            <select
              type="text"
              onChange={this.handleChange.bind(this, "props")}
              value={this.state.props.size}
              name="size"
            >
              <option>S</option>
              <option>M</option>
              <option>L</option>
              <option>XL</option>
            </select>
          </div></row>
          <row><div>
            <label>Price:</label>
            <input
              type="text"
              onChange={this.handleChange.bind(this, "props")}
              value={this.state.price}
              name="price"
            />
          </div></row>

          <button onClick={this.handleSubmit.bind(this)}>Submit</button>
        </div>
      );
    }
}

module.exports = VSSAdmin;
