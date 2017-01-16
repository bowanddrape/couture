
const fs = require('fs');
const https = require('https');
const jsonwebtoken = require('jsonwebtoken');

const SQLTable = require('./SQLTable');
const Mail = require('./Mail');

const jwt_secret = fs.readFileSync('./jwt_secret');

// enumerate available roles
const available_roles = ["bowanddrape", "nordstrom", "bloomingdales", "thebay", "lordandtaylor"];

class User extends SQLTable {
  constructor(user) {
    super();
    this.email = user.email.toLowerCase(); // remember lowercase while selecting
    this.passhash = user.passhash;
    this.verified = user.verified;
    this.props = user.props;
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "users",
      pkey: "email",
      fields: ["passhash", "verified", "props"]
    };
  }

  static handleHTTP(req, res, next) {
    req.path_tokens = req.url.split('?')[0].split('/').slice(1);

    if (req.path_tokens[0]!='user') {
      return next();
    }

    // handle login
    if (req.path_tokens[1]=='login') {
      return User.handleLogin(req, res);
    }

    if (req.path_tokens[1]=='register') {
      return User.handleRegister(req, res);
    }

    if (req.path_tokens[1]=='verify') {
      if (req.method=="POST") {
        return User.get(req.body.email, function(err, user) {
          if (err || !user)
            return res.json({error: {email: "Please register first!"}});
          user.verifying = true;
          User.generateJwtToken(user, (err, token) => {
            Mail.send(user.email, "Verify your Bow & Drape Account", `Click <a href="https://staging.bowanddrape.com/user/verify/${token}">here</a> to verify ownership your account`, (err) => {
              if (err) return res.json({error: err.toString()});
              res.json({error: 'email sent, please wait a few mins for it to reach your inbox'});
            });
          });
        });
      } // POST, send email
      if (req.method=="GET") {
        return jsonwebtoken.verify(req.path_tokens[2], jwt_secret, (err, user) => {
          if (err) return res.json({error:err});
          if (!user.verifying) return res.json({err:"invalid token"});
          user = new User(user);
          user.verified = true;
          user.upsert((err, result) => {
            if (err) return res.json({error:err});
            return res.end("Your account is now verified! In the future, this will be a page that will have you set a new password");
          });
        });
      }
    }

    next();
  }

  static handleAuthentication(req, res, next) {
    let token = null;
    // check cookie
    if (req.cookies.token) {
      token = req.cookies.token;
    }
    // check auth header
    if (/Bearer /i.test(req.header('Authorization'))) {
      token = req.header('Authorization').substr(7);
    }

    // ignore if no creds supplied
    if (!token) return next();

    // verify token
    if (token) {
      jsonwebtoken.verify(token, jwt_secret, function(err, user) {
        if (err) {
          console.log("user token verify error: "+err.message);
          req.user = null;
          return next();
        }
        req.user = new User(user);
        req.user.populateRoles();
        next();
      });
    }
  }

  // check a passhash and return a token
  static handleLogin(req, res) {
    if (req.body.fb_access_token) {
      // attempt fb auth
      let request = https.request({
          protocol: 'https:',
          method: 'GET',
          hostname: 'graph.facebook.com',
          path: `/v2.8/me?access_token=${req.body.fb_access_token}&debug=all&fields=id,name,email,picture&format=json&method=get&pretty=0&suppress_http_code=1`
        }, function (result) {
          result.setEncoding('utf8');
          let facebook_user = '';
          result.on('data', function(data) {
            facebook_user+=data;
          });
          result.on('end', function() {
            try {
              facebook_user = JSON.parse(facebook_user);
            } catch(err) {
              console.log(err);
            }

            // reformat data to be consistent
            facebook_user.props = {};
            facebook_user.props.image = facebook_user.picture.data.url;
            facebook_user.props.name = facebook_user.name;
            facebook_user.props.facebook_login = true;

            let user = new User(facebook_user);
            user.upsert(function(err, result) {
              if (err) console.log(err);
              User.sendJwtToken(res, user);
            });
          });
        }
      );
      request.on('error', function(err) {console.log(err);});
      request.end();
      return;
    } else if (req.body.email && req.body.passhash) {
      // try password auth
      return User.get(req.body.email.toLowerCase(), function(err, user) {
        if (err) {
          return res.json({error:"something went wrong, hold on while we investigate"}).end();
        }

        // if user did not exist, create one
        if (!user)
          return User.handleRegister(req, res);

        if (!user.passhash)
          return res.json({error:{password:"Verify your email to set password"}}).end();
        if (user.passhash!=req.body.passhash)
          return res.json({error:{password:"Incorrect password"}}).end();
        User.sendJwtToken(res, user);
      });
    }

    return res.json({error:"no login credentials"}).end();
  }

  static sendJwtToken(res, user) {
    User.generateJwtToken(user, function(err, token) {
      res.json({token: token}).end();
    });
  }

  static generateJwtToken(user, callback) {
    user.populateRoles();
    delete user.passhash; // strip off the password part
    user.props.name = user.props.name ? user.props.name : user.email; // default name to email
    user.iat = Math.floor(Date.now() / 1000);
    user.exp = Math.floor(Date.now() / 1000) + 60*60*24*7;
    jsonwebtoken.sign(user, jwt_secret, {}, function(err, token) {
      if (err) console.log(err); // TODO: escalate this
      callback(err, token);
    });
  }

  // create a new user
  static handleRegister(req, res) {
    User.get(req.body.email, function(err, user) {
      if (user) return res.json({error:"user exists"}).end();

      let new_user = new User({
        email: req.body.email,
        passhash: req.body.passhash,
        props: {
          login_mode: "passhash"
        }
      });
      new_user.upsert(function(err, result) {
        if (err) console.log(err); // TODO: escalate this
        // login as the new user
        User.sendJwtToken(res, new_user);
      });
    });
  }

  // lookup user roles
  populateRoles() {
    this.roles = [];
    // only verified users get roles
    if (!this.verified)
      return;
    // add domain role
    let domain_role = this.email.substring(0, this.email.lastIndexOf('.')).substring(this.email.indexOf('@')+1);
    if (available_roles.indexOf(domain_role)>=0)
      this.roles.push(domain_role);
  }
}


module.exports = User;
