

const React = require('react');
const bcrypt = require('bcryptjs');

class UserProfile extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    // if we don't have a user, display login area
    if (!this.props.user || !this.props.user.email) {
      let errors = [];
      if (this.props.user && this.props.user.error) {
        errors.email = this.props.user.error.email;
        errors.password = this.props.user.error.password;
      }
      return (
        <login>
          <input id="email" className={errors.email?"error":""} placeholder={errors.email?errors.email:'email address'} type="text"/>
          <br/>
          <input id="password" className={errors.password?"error":""} placeholder={errors.password?errors.password:"password"} type="password"/>
          <msg>{typeof(this.props.user.error)=="string"?this.props.user.error:""}</msg>
          <button onClick={this.login}>Login / Register</button>
          <button onClick={this.verify}>Verify / Forgot Pass</button>
        </login>
      );
    }

    return (
      React.createElement("user", {},
        <img className="pizza" src={this.props.user.props.image}></img>,
        <name>{this.props.user.props.name}</name>,
        "! Welcome Home!",
      )
    );
  }

  componentDidUpdate() {
    if (!this.props.user || !this.props.user.error) return;
    if (this.props.user.error.email)
      document.getElementById("email").value = "";
    document.getElementById("password").value = "";
  }

  login() {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let error = null;
    if (!email) {
      error = error?error:{};
      error.email = "Must enter email";
    }
    if (!password) {
      error = error?error:{};
      error.password = "Must enter password";
    }
    if (error)
      return BowAndDrape.dispatcher.emit('user', {error: error});

    UserProfile.hashPassword(email, password, (err, passhash) => {
      if (err) console.log(err);
      let payload = {
        email: email,
        passhash: passhash,
      }
      UserProfile.sendLoginRequest(payload);
    });
  }

  static hashPassword(email, password, callback) {
    let salt = ("$2a$10$bsalty"+email.replace(/[@+\.]/g,"").toLowerCase()+"saltysaltsalt").substring(0,29);
    bcrypt.hash(password, salt, (err, passhash) => {
      callback(err, passhash.substring(29));
    });
  }

  verify() {
    let email = document.getElementById("email").value;
    if (!email)
      return BowAndDrape.dispatcher.emit('user', {error: {email: "Must enter email"}});
    let payload = {email: email};
    var self = this;
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/user/verify", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
      if (this.readyState!=4) { return; }
      return BowAndDrape.dispatcher.emit('user', JSON.parse(this.responseText));
    }
    xhr.send(JSON.stringify(payload));
  }

  static sendLoginRequest(payload) {
    // login to bowanddrape
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/user/login", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
      if (this.readyState!=4) { return; }
      BowAndDrape.dispatcher.handleAuth(JSON.parse(this.responseText));
    }

    xhr.send(JSON.stringify(payload));
  }
}

module.exports = UserProfile;
