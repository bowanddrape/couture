
require('dotenv').config();

const fs = require('fs');
const google = require('googleapis');
const googleAuth = require('google-auth-library');
const Log = require('./Log.js');
const os = require('os');
const https = require('https');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_DIR = __dirname+'/../';
const TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com.token';

class GoogleSheets {
  constructor(id) {
    this.spreadsheet_id = id;
    this.google_sheets = google.sheets('v4');
  }

  init(callback) {
    let options = {
      "web": {
        "client_id": "251361142965-c4df3c1dg8dub2j22n1ie4rn70fnm3dp.apps.googleusercontent.com",
        "project_id": "couture-150216",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://accounts.google.com/o/oauth2/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "uuYtwrpqNeSueifRX2TyD4er",
        "redirect_uris": ["https://staging.bowanddrape.com"],
        "javascript_origins": ["https://staging.bowanddrape.com"]
      }
    };
    // Authorize a client with the loaded credentials, then call the
    // Google Sheets API.
    GoogleSheets.authorize(options, (err, auth) => {
      if (err) return callback(err);
      this.auth = auth;
      callback(err, auth);
    });
  }

  query(range, callback) {
    this.google_sheets.spreadsheets.values.get({
      auth: this.auth,
      spreadsheetId: this.spreadsheet_id,
      range: range,
    }, (err, result) => {
      // if err, try re-authing
      if (err) {
        return this.init(() => {
          this.query(range, callback);
        });
      }
      callback(err, result);
    });
  }

  update(start, rows, callback) {
    rows = rows.map((row) => {
      let values = row.map((value) => {
        return {userEnteredValue: {stringValue: value}};
      });
      return {values};
    });

    this.google_sheets.spreadsheets.batchUpdate({
      auth: this.auth,
      spreadsheetId: this.spreadsheet_id,
      resource: {requests: [{
        updateCells: {
          start,
          rows,
          fields: 'userEnteredValue'
        }
      }]}
    }, (err, response) => {
      if (err) console.info(err);
      if (callback) callback();
    });
  }

  /**
   * Store token to disk be used in later program executions.
   *
   * @param {Object} token The token to store to disk.
   */
  static storeToken(token) {
    try {
      fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
      if (err.code != 'EEXIST') {
        throw err;
      }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.info('Token ' + JSON.stringify(token) + ' stored to ' + TOKEN_PATH);
  }

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   *
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  static authorize(credentials, callback) {
    var clientSecret = credentials.web.client_secret;
    var clientId = credentials.web.client_id;
    var redirectUrl = credentials.web.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
      if (err) {
        GoogleSheets.getNewToken(oauth2Client, callback);
      } else {
        oauth2Client.credentials = JSON.parse(token);
        callback(null, oauth2Client);
      }
    });
  }

  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   *
   * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback to call with the authorized
   *     client.
   */
  static getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    });
    Log.message(`Authorize this app by visiting this url ${authUrl} and replying \`@${Log.username} [code]\` with the code copied from the url`);
    // TODO if I set up the redirect uris properly you don't need to chat it
    Log.listen.once('message', (message) => {
      let toks = message.split(' ');
      let code = toks[1];

      oauth2Client.getToken(code, function(err, token) {
        if (err) return callback(err);
        oauth2Client.credentials = token;
        GoogleSheets.storeToken(token);
        callback(null, oauth2Client);
      });
    });
  }
}
module.exports = GoogleSheets;

