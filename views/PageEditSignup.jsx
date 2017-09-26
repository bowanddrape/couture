
const React = require('react');

/***
called by PageEdit
***/
class PageEditSignup extends React.Component {

  constructor(props) {
    super(props);
  }

  handleUpdate(is_unique, index, key) {
    if (!this.props.onChange) return;
    let update = this.props || {};
    update = JSON.parse(JSON.stringify(update));
    if (is_unique)
      update.unique_keys[index] = key;
    else
      update.misc_keys[index] = key;
    this.props.onChange(update);
  }

  handleUpdateSelectors() {
    if (!this.props.onChange) return;
    let update = this.props || {};
    update = JSON.parse(JSON.stringify(update));
    let selectors = {};

    // make selectors a key-value pair, where the value is an array of options
    this.selectors.querySelectorAll("card").forEach((card) => {
      let key = card.querySelector('input[name="key"]').value;
      if (!key.trim()) return;
      let options = card.querySelector('input[name="options"]').value;
      selectors[key] = options.split(',').map((option) => {
        return option.trim();
      }).filter((option) => {
        return option;
      });
    });
    update.selectors = selectors;
    this.props.onChange(update);
  }

  handleNewCard(is_unique) {
    if (!this.props.onChange) return;
    let update = this.props || {};
    update = JSON.parse(JSON.stringify(update));
    if (is_unique) {
      update.unique_keys = update.unique_keys || [];
      update.unique_keys.push("");
    } else {
      update.misc_keys = update.misc_keys || [];
      update.misc_keys.push("");
    }
    this.props.onChange(update);
  }

  handleRemoveCard(is_unique, index) {
    if (!this.props.onChange) return;
    let update = this.props || {};
    update = JSON.parse(JSON.stringify(update));
    if (is_unique) {
      update.unique_keys.splice(index, 1);
    } else {
      update.misc_keys.splice(index, 1);
    }
    this.props.onChange(update);
  }

  render() {
    let unique_keys = [];
    if (this.props.unique_keys) {
      this.props.unique_keys.forEach((key, index) => {
        unique_keys.push(
          <card key={index} style={{display:"flex"}}>
            <input type="text" onChange={(event)=>{this.handleUpdate(true, index, event.target.value)}} value={key}/>
            <span onClick={this.handleRemoveCard.bind(this, true, index)}>x</span>
          </card>
        );
      });
    }

    let misc_keys = [];
    if (this.props.misc_keys) {
      this.props.misc_keys.forEach((key, index) => {
        misc_keys.push(
          <card key={index} style={{display:"flex"}}>
            <input type="text" onChange={(event)=>{this.handleUpdate(false, index, event.target.value)}} value={key}/>
            <span onClick={this.handleRemoveCard.bind(this, false, index)}>x</span>
          </card>
        );
      });
    }

    let selectors = [];
    if (this.props.selectors) {
      Object.keys(this.props.selectors).forEach((key) => {
        selectors.push(
          <card key={selectors.length} style={{display:"flex"}}>
            <input type="text" onChange={(event)=>{this.handleUpdateSelectors()}} name="key" value={key}/>
            <input type="text" onChange={(event)=>{this.handleUpdateSelectors()}} name="options" value={this.props.selectors[key].join(", ")}/>
          </card>
        );
      });
    }
    selectors.push(
      <card key={selectors.length} style={{display:"flex"}}>
        <input type="text" onChange={(event)=>{this.handleUpdateSelectors()}} name="key" value="" placeholder="new selector"/>
        <input type="text" onChange={(event)=>{this.handleUpdateSelectors()}} name="options" value="" placeholder="comma-separated options"/>
      </card>
    );

    return (
      <div>
        <deck>
          {unique_keys}
        </deck>
        <card onClick={this.handleNewCard.bind(this, true)}>New Key Field</card>

        <div></div>
        <deck>
          {misc_keys}
        </deck>
        <card onClick={this.handleNewCard.bind(this, false)}>New Misc Field</card>

        <deck ref={(element)=>{this.selectors = element;}}>
          {selectors}
        </deck>
      </div>
    );
  }
}

module.exports = PageEditSignup;
