
const React = require('react');
const Switch = require('./Switch.jsx');

/***
Display a signup
***/
class Signup extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      id: {},
      props: {},
    };
    if (this.props.unique_keys) {
      this.props.unique_keys.forEach((key) => {
        this.state.id[key] = "";
      });
    }
    if (this.props.hidden_keys) {
      Object.keys(this.props.hidden_keys).forEach((key) => {
        this.state.id[key] = this.props.hidden_keys[key];
      });
    }
    if (this.props.misc_keys) {
      this.props.misc_keys.forEach((key) => {
        this.state.props[key] = "";
      });
    }
    if (this.props.selectors) {
      Object.keys(this.props.selectors).forEach((key) => {
        this.state.props[key] = "";
      });
    }
  }

  handleSubmit() {
    let payload = JSON.parse(JSON.stringify(this.state));
    payload.id.url = location.href;
    BowAndDrape.api("POST", "signup", payload, (err, resp) => {
      document.querySelector("signup").innerHTML = "Thank You!";
    });
  }

  handleChange(is_unique, key, value) {
    return this.setState((prevState, prevProps) => {
      let state = JSON.parse(JSON.stringify(prevState));
      if (is_unique)
        state.id[key] = value;
      else
        state.props[key] = value;
      return state;
    });
  }

  handleChangeSelector(key, value) {
    return this.setState((prevState) => {
      let state = JSON.parse(JSON.stringify(prevState));
      state.props[key] = value;
      return state;
    });
  }

  render() {
    let selectors = [];
    if (this.props.selectors) {
      Object.keys(this.props.selectors).forEach((key) => {
        let options = [];
        this.props.selectors[key].forEach((option) => {
          options.push(<option key={options.length} value={option}>{option}</option>);
        });
        selectors.push(
          <card key={selectors.length} style={{display:"flex",flexDirection:"column"}}>
            <label name="key" >{key}</label><br/>
            <Switch onChange={(value)=>{this.handleChangeSelector(key, value)}} value={this.state.props[key]} always_expanded={true} style={{justifyContent:"center"}}>
              {options}
            </Switch>
          </card>
        );
      });
    }

    let unique_keys = [];
    if (this.props.unique_keys) {
      this.props.unique_keys.forEach((key) => {
        if (!key) return;
        unique_keys.push(
          <div key={unique_keys.length}>
            <input type="text" placeholder={key} onChange={(event)=>{this.handleChange(true, key, event.target.value)}} value={this.state.id[key]}/>
          </div>
        );
      });
    }
    let misc_keys = []
    if (this.props.misc_keys) {
      this.props.misc_keys.forEach((key) => {
        if (!key) return;
        misc_keys.push(
          <div key={misc_keys.length}>
            <input type="text" placeholder={key} onChange={(event)=>{this.handleChange(false, key, event.target.value)}} value={this.state.props[key]}/>
          </div>
        );
      });
    }

    return (
      <div>
        <signup>
          {unique_keys}
          {selectors}
          {misc_keys}
          <button className="primary" onClick={this.handleSubmit.bind(this)}>{this.props.BtnText}</button>
        </signup>
      </div>
    );
  }

}

module.exports = Signup;
