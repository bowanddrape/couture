
const React = require('react');

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
      this.props.unique_keys.map((key) => {
        this.state.id[key] = "";
      });
    }
    if (this.props.misc_keys) {
      this.props.misc_keys.map((key) => {
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

  render() {
    let unique_keys = [];
    this.props.unique_keys.forEach((key) => {
      if (!key) return;
      unique_keys.push(
        <div key={unique_keys.length}>
          <label>{key}</label>
          <input type="text" onChange={(event)=>{this.handleChange(true, key, event.target.value)}} value={this.state.id[key]}/>
        </div>
      );
    });
    let misc_keys = []
    if (this.props.misc_keys) {
      this.props.misc_keys.forEach((key) => {
        if (!key) return;
        misc_keys.push(
          <div key={misc_keys.length}>
            <label>{key}</label>
            <input type="text" onChange={(event)=>{this.handleChange(false, key, event.target.value)}} value={this.state.props[key]}/>
          </div>
        );
      });
    }

    return (
      <div>
        <signup>
          {unique_keys}
          {misc_keys}
          <button onClick={this.handleSubmit.bind(this)} style={{margin:"auto"}}>SUBMIT</button>
        </signup>
      </div>
    );
  }

}

module.exports = Signup;
