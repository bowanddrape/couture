
const fs = require('fs');
const https = require('https');
const jsonwebtoken = require('jsonwebtoken');

const SQLTable = require('./SQLTable');
const Mail = require('./Mail');
const Page = require('./Page');

const LayoutBasic = require('../views/LayoutBasic.jsx');
const LayoutEmail = require('../views/LayoutEmail.jsx');

const UserPasswordReset = require('../views/UserPasswordReset.jsx');
const UserVerifyEmail = require('../views/UserVerifyEmail.jsx');

const jwt_secret = fs.readFileSync('./jwt_secret');

// enumerate available roles
const available_roles = ["bowanddrape", "nordstrom", "bloomingdales", "thebay", "lordandtaylor"];

/***
Handle all things related to user auth and settings
***/
class User extends SQLTable {
  constructor(user) {
    super();
    Object.assign(this, user);
    if (user.email)
      this.email = user.email.toLowerCase(); // remember lowercase while selecting
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "users",
      pkey: "email",
      fields: ["passhash", "verified", "props", "credits"]
    };
  }

  static handleHTTP(req, res, next) {
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
            return res.json({error:"Please register first!"});
          user.verifying = true;
          User.generateJwtToken(user, (err, token) => {
            if (err) return res.json({error: err.toString()});
            let body = Page.renderString([{
              component: UserVerifyEmail,
              props: {
                user: user,
                link: `https://${req.headers.host}/user/verify/${token}`,
                host: JSON.parse(JSON.stringify(req.headers.host)),
              }
            }], LayoutEmail);
            Mail.send(user.email, "Verify your Bow & Drape Account", body, (err) => {
              // FIXME for some reason this line is giving errors, ignoring for now
              try {
                return res.json({error: 'email sent, please check your inbox'});
              } catch(err) {}
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
            return Page.render(req, res, UserPasswordReset, {}, LayoutBasic);
          });
        });
      }
    }

    if (req.path_tokens[1]=="reset_password" && req.method=="POST") {
      if (!req.user) {
        return res.status(401).json({"error":"invalid authorization"});
      }
      req.user.passhash = req.body.passhash;
      return req.user.upsert(function(err, result) {
        if (err) return res.status(500).json({"error":"could not update password"});
        User.sendJwtToken(res, req.user);
      });
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
    // check querystring
    if (req.query && req.query.token) {
      token = req.query.token;
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
        // do a db fetch if we are about to try something
        if (req.method=='POST') {
          return User.get(user.email, (err, user) => {
            if (err || !user) {
              req.user = null;
              return next();
            }
            req.user = user;
            req.user.populateRoles();
            next();
          });
        }
        // otherwise just trust the token
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
          return res.json({error:"Select 'Forgot Password' to set a password"}).end();
        if (user.passhash!=req.body.passhash)
          return res.json({error:"Incorrect password"}).end();
        User.sendJwtToken(res, user);
      });
    } else if (req.user) {
      // if the user is already logged in, just issue a new token
      return User.sendJwtToken(res, req.user);
    }

    return res.json({error:"no login credentials"}).end();
  }

  static sendJwtToken(res, user) {
    User.generateJwtToken(user, function(err, token) {
      res.json({token: token}).end();
    });
  }

  static generateJwtToken(user, callback) {
    if (!user) return "no user";
    user.populateRoles();
    delete user.passhash; // strip off the password part
    user.props.name = user.props.name ? user.props.name : user.email; // default name to email
    user.iat = Math.floor(Date.now() / 1000);
    user.exp = Math.floor(Date.now() / 1000) + 60*60*24*7;
    jsonwebtoken.sign(user, jwt_secret, {}, function(err, token) {
      if (err) console.log("User::generateJwtToken "+err.toString());
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
