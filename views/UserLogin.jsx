
const React = require('react');
const bcrypt = require('bcryptjs');
const jwt_decode = require('jwt-decode');

const FacebookLogin = require('./FacebookLogin.jsx');
const Errors = require('./Errors.jsx');

class UserLogin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {},
      loginState: 'login',
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

        // google analytics event
        try {
          let user = jwt_decode(BowAndDrape.token);
          gtag('event', 'login', {'method': user.props.login_mode});
        } catch (err) { console.log(err); }
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
      <login className={this.state.loginState} style={this.props.style}>
        <section className="loginForm">
          <Errors label="login" />
          <div className="resetAction">
            <span className="formHead">Forgot Password</span>
            Enter your email address and we’ll send you instructions to reset your password.
            <button className="loginNav" onClick={()=>{this.setState({loginState:'login'})}}>Back to Sign In</button>
          </div>
          <div>
            <input ref={(input)=>{this.fields.email=input}} placeholder="email address" type="text" name="email"/>
            <input ref={(input)=>{this.fields.password=input}} placeholder="password" onKeyUp={(event)=>{if(event.which==13){this.login()}}} type="password" name="password"/>
            <button className="primary registerBtn" onClick={this.login.bind(this)}>Create Account</button>
            <button className="primary loginBtn" onClick={this.login.bind(this)}>Sign In</button>
            <button className="primary resetBtn" onClick={this.verify.bind(this)}>Send Reset Instructions</button>
          </div>
          <div className="formActions">
            <button className="loginNav forgotPassword" onClick={()=>{this.setState({loginState:'forgot'})}}>Forgot Password?</button>
              <FacebookLogin user={this.state.user}/>
          </div>
          <div className="formSubAction">
            <div className="registerAction topLine">
              I'm new here <button className="loginNav" onClick={()=>{this.setState({loginState:'register'})}}>Create An Account</button>
            </div>
            <div className="loginAction topLine">
              Already have an account? <button className="loginNav" onClick={()=>{this.setState({loginState:'login'})}}>Sign In Now</button>
            </div>
          </div>
        </section>
        {this.props.cta ? <div className="cta">{this.props.cta}</div> : null}
      </login>
    );
  }
}

module.exports = UserLogin;
