
const fs = require('fs');
const https = require('https');
const jsonwebtoken = require('jsonwebtoken');

const SQLTable = require('./SQLTable');

const jwt_secret = fs.readFileSync('./jwt_secret');

class User extends SQLTable {
  constructor(user) {
    super();
    this.email = user.email.toLowerCase();
    this.passhash = user.passhash;
    this.props = user.props;
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "users",
      pkey: "email",
      fields: ["passhash", "props"]
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
    console.log("user endpoint");
    console.log(req.method);
    console.log(req.body);
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
          req.user = {error: err.message};
          return next();
        }
        req.user = new User(user);
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
            delete facebook_user.picture;
            facebook_user.props.login_mode = "facebook";
            facebook_user.props.name = facebook_user.name;

            let user = new User(facebook_user);
            user.upsert(function(err, result) {
              if (err) console.log(err);
              User.sendJwtToken(res, facebook_user);
            });
          });
        }
      );
      request.on('error', function(err) {console.log(err);});
      request.end();
    } else {
      // try password auth
      User.get(req.body.email, function(err, user) {
        if (!user) return res.json({error:"user not found"}).end();
        if (!user.passhash)
          return res.json({error:"password not set"}).end();
        if (user.passhash.toString('hex')!=req.body.passhash)
          return res.json({error:"incorrect password"}).end();
        user.login_mode = "passhash";
        User.sendJwtToken(res, user);
      });
    }

  }

  static sendJwtToken(res, user) {
    delete user.passhash; // strip off the password part
    user.name = user.name ? user.name : user.email; // default name to email
    user.iat = Math.floor(Date.now() / 1000);
    user.exp = Math.floor(Date.now() / 1000) + 60*24*7;
    jsonwebtoken.sign(user, jwt_secret, {}, function(err, token) {
      if (err) console.log(err);
      res.json({token: token}).end();
    });
  }

  // create a new user
  static handleRegister(req, res) {
    User.get(req.body.email, function(err, user) {
      if (user) return res.json({error:"user exists"}).end();

      // login as the new user
      User.handleLogin(req, res);
    });
  }
}


module.exports = User;
