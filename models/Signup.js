
const JSONAPI = require('./JSONAPI');
const User = require('./User');

class Signup extends JSONAPI {

  constructor(signup) {
    super();
    Object.assign(this, signup);
  }

  static getSQLSettings() {
    return {
      tablename: "signup",
      pkey: "id",
      fields: ["time", "props"]
    };
  }

  // extends JSONAPI
  hasApiPermission(req, res) {
    return true;
  }

  static isEmail(string) {
    if (typeof(string)!="string") return false;
    return /.+@.+\..+/.test(string);
  }

  onApiSave(req, res, object, callback) {
    // handle email signups
    if (object.id && object.id.newsletter && Signup.isEmail(object.id.email)) {
      let email = object.id.email.trim().toLowerCase();
      User.get(email, (err, user) => {
        // ignore if user already signed up
        if (user && user.props.newsletter) return;
        user = user || new User({
          email,
        });
        user.props.newsletter = Math.floor(new Date().getTime()/1000);
        user.upsert((err) => {
          if (err)
            console.log("error subscribing user to newsletter "+err);
        });
      });
    }

    // console log comments
    if (object.props && object.props["Other comments?"]) {
      console.log(`${object.id.email}: ${object.props["Other comments?"]}`);
    }

    super.onApiSave(req, res, object, callback);
  }
}

module.exports = Signup;
