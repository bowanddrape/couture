
const React = require('react');
const bcrypt = require('bcryptjs');

const FacebookLogin = require('./FacebookLogin.jsx');
const Errors = require('./Errors.jsx');

class UserLogin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {},
    }
  }

  componentDidMount() {
    if (BowAndDrape) {
      BowAndDrape.dispatcher.on("user", (user) => {
        this.setState({user});
      });
    }
  }

  login() {
    Errors.emitError("login_clear");
    let email = this.fields.email.value;
    let password = this.fields.password.value;
    if (!email) {
      return Errors.emitError("login", "Must enter email");
    }
    if (!password) {
      return Errors.emitError("login", "Must enter password");
    }

    UserLogin.hashPassword(email, password, (err, passhash) => {
      if (err) console.log(err);
      let payload = {
        email: email,
        passhash: passhash,
      }
      BowAndDrape.api("POST", "/user/login", payload, (err, response) => {
        if (err)
          Errors.emitError("login", err);
        BowAndDrape.dispatcher.handleAuth(response);
      });
    });
  }

  static hashPassword(email, password, callback) {
    // oh man, you may be thinking that showing your salt is some n00b mistake
    // and you're not wrong, so always pepper and hope that pepper doesn't leak
    let salt = ("$2a$10$bsalty"+email.replace(/[@+\.]/g,"").toLowerCase()+"saltysaltsalt").substring(0,29);
    bcrypt.hash(password, salt, (err, passhash) => {
      callback(err, passhash.substring(29));
    });
  }

  verify() {
    let email = this.fields.email.value;
    if (!email)
      return Errors.emitError("login", "Must enter email");
    let payload = {email: email};
    BowAndDrape.api("POST", "/user/verify", payload, (err, response) => {
      // okay, so this endpoint is weird and uses an error to talk back =(
      return Errors.emitError("login", err);
    });
  }

  render() {
    if (this.state.user.email)
      return null;

    this.fields = this.fields || {};
    return (
      <login style={this.props.style}>
        <Errors label="login" />
        <input ref={(input)=>{this.fields.email=input}} placeholder="email address" type="text" name="email" style={{display:"block"}}/>
        <input ref={(input)=>{this.fields.password=input}} placeholder="password" onKeyUp={(event)=>{if(event.which==13){this.login()}}} type="password" name="password" style={{display:"block"}}/>
        <button onClick={this.login.bind(this)}>Login / Register</button>
        <button onClick={this.verify.bind(this)}>Verify / Forgot Pass</button>
        {this.props.cta ? <div className="cta">{this.props.cta}</div> : null}
        <FacebookLogin user={this.state.user}/>
      </login>
    );
  }
}

module.exports = UserLogin;
