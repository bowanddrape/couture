

const React = require('react');
const bcrypt = require('bcryptjs');

/***
Widget to show logged-in user. If not logged in, allow user to log in?
props:
  user:{} // user object
***/
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
          <input id="password" className={errors.password?"error":""} placeholder={errors.password?errors.password:"password"} onKeyUp={(event)=>{if(event.which==13){this.login()}}} type="password"/>
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
      BowAndDrape.api("POST", "/user/login", payload, (err, response) => {
        BowAndDrape.dispatcher.handleAuth(response);
      });
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
    BowAndDrape.api("POST", "/user/verify", payload, (err, response) => {
      BowAndDrape.dispatcher.emit('user', response);
    });
  }

}

module.exports = UserProfile;
