
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
      </div>
    );
  }
}

module.exports = PageEditSignup;
