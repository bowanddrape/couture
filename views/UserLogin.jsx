
const React = require('react');
const bcrypt = require('bcryptjs');

const Errors = require('./Errors.jsx');

class UserLogin extends React.Component {

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
      return Errors.emitError("login", response.error);
    });
  }
  render() {
    this.fields = this.fields || {};
    return (
      <login>
        <Errors label="login" />
        <input ref={(input)=>{this.fields.email=input}} placeholder="email address" type="text"/>
        <input ref={(input)=>{this.fields.password=input}} placeholder="password" onKeyUp={(event)=>{if(event.which==13){this.login()}}} type="password"/>
        <button onClick={this.login.bind(this)}>Login / Register</button>
        <button onClick={this.verify.bind(this)}>Verify / Forgot Pass</button>
      </login>
    );
  }
}

module.exports = UserLogin;
