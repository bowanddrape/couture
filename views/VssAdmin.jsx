const React = require('react');

/***
Draws the Virtual Sample Sale Admin page.

***/

class VssAdmin extends React.Component {
    constructor(props) {
        super(props);
        //ADD STATES HERE
        this.state = {
            sku: '',
            props: {
                description: '',
                price: '',
                size: '',
            },
        };

        // This binding is necessary to make `this` work in the callback
        this.handleSubmit = this.handleSubmit.bind(this);
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
      });
    }

    render() {
        return(
            <div>
                <section>New VSS Item</section>
                <row>
                    <div>
                    <label>SKU:</ label>
                    <input
                        type="text"
                        onChange={this.handleSKU.bind(this)}
                        value={this.state.sku}
                        name="sku"/>
                    </ div>
                </ row>
                <row>
                    <div>
                    <label>Description:</ label>
                    <input
                        type="text"
                        onChange={this.handleChange.bind(this, "props")}
                        value={this.state.props.description}
                        name="description"/>
                    </ div>
                </ row>
                <row>
                    <div>
                    <label>Size:</ label>
                    <select
                        value={this.state.props.size}
                        onChange={this.handleChange.bind(this, "props")}
                        name="size">
                        <option>S</option>
                        <option>M</option>
                        <option>L</option>
                        <option>XL</option>
                    </ select>
                    </ div>
                </ row>
                <row>
                    <div>
                    <label>Price:</ label>
                    <input
                        type="text"
                        onChange={this.handleChange.bind(this, "props")}
                        value={this.state.price}
                        name="price"/>
                    </ div>
                </ row>

            <button onClick={this.handleSubmit}>Submit</button>
            </ div>

        );
    }
}

module.exports = VssAdmin;