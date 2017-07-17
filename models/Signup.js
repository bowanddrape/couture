
const JSONAPI = require('./JSONAPI');

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

}

module.exports = Signup;
