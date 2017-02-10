

require('dotenv').config();

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var async = require('async');
var SQLTable = require('../models/SQLTable.js');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
var TOKEN_DIR = __dirname+'/../';
var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile(__dirname+'/../google_api_client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Google Sheets API.
  authorize(JSON.parse(content), callback);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.web.client_secret;
  var clientId = credentials.web.client_id;
  var redirectUrl = credentials.web.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
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
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}


function callback(auth) {
  var sheets = google.sheets('v4');
  sheets.spreadsheets.values.get({
    auth: auth,
    spreadsheetId: '1qiRQ8-ZFqriV6F3ARGDcT9wi19f3ISIaZ4lbsT7ZGJk',
    //range: {sheetId: 2034869686, startRowIndex: 100, endRowIndex:100, startColumnIndex: 38, endColumnIndex:67
    range: 'Metrics**!AM101:BR101',
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }

    let date_range = response.values[0];

    let requests = [];
    let repeat_customers_online = [];
    let repeat_customers_offline = [];
    let new_customers_offline2online = [];
    let new_customers_online2offline = [];

    // populate sql queries
    date_range.map((range) => {
      dates = JSON.parse(range).map((datestring) => {return new Date(datestring).getTime()/1000});
      let query = `SELECT count(1) FROM orders o WHERE o.placed>='${dates[0]}' AND o.placed<'${dates[1]}' AND o.props->>'imported'='haute' AND o.email NOT LIKE '%bowanddrape.com' AND EXISTS (SELECT 1 FROM orders WHERE orders.email=o.email AND orders.placed<o.placed AND orders.props->>'imported'='haute');`;
      repeat_customers_online.push(SQLTable.sqlQuery.bind(this, null, query, []));

      query = `SELECT count(1) FROM orders o WHERE o.placed>='${dates[0]}' AND o.placed<'${dates[1]}' AND o.props->>'imported'='kiosk' AND EXISTS (SELECT 1 FROM orders WHERE orders.email=o.email AND orders.placed+43200<o.placed AND orders.props->>'imported'='kiosk');`; // seperate orders by a half-day as they're entered individually
      repeat_customers_offline.push(SQLTable.sqlQuery.bind(this, null, query, []));

      query = `SELECT count(1) FROM orders o WHERE o.placed>='${dates[0]}' AND o.placed<'${dates[1]}' AND o.props->>'imported'='haute' AND EXISTS (SELECT 1 FROM orders WHERE orders.email LIKE o.email AND orders.placed<o.placed AND orders.props->>'imported'='kiosk');`;
      new_customers_offline2online.push(SQLTable.sqlQuery.bind(this, null, query, []));

      query = `SELECT count(1) FROM orders o WHERE o.placed>='${dates[0]}' AND o.placed<'${dates[1]}' AND o.props->>'imported'='kiosk' AND EXISTS (SELECT 1 FROM orders WHERE orders.email LIKE o.email AND orders.placed<o.placed AND orders.props->>'imported'='haute');`;
      new_customers_online2offline.push(SQLTable.sqlQuery.bind(this, null, query, []));
    });

    let sql_tasks = [];
    sql_tasks.push(async.parallel.bind(this, repeat_customers_online));
    sql_tasks.push(async.parallel.bind(this, repeat_customers_offline));
    sql_tasks.push(async.parallel.bind(this, new_customers_offline2online));
    sql_tasks.push(async.parallel.bind(this, new_customers_online2offline));

    async.parallel(sql_tasks, (err, data) => {
      if (err) return console.log(err);
      let rows = [];

      rows.push({values: data[0].map((sql_result) => {
        return {userEnteredValue: {numberValue: parseInt(sql_result.rows[0].count)}};
      })});
      rows.push({values: data[1].map((sql_result) => {
        return {userEnteredValue: {numberValue: parseInt(sql_result.rows[0].count)}};
      })});
      rows.push({values: data[2].map((sql_result) => {
        return {userEnteredValue: {numberValue: parseInt(sql_result.rows[0].count)}};
      })});
      rows.push({values: data[3].map((sql_result) => {
        return {userEnteredValue: {numberValue: parseInt(sql_result.rows[0].count)}};
      })});

      //repeat_customers.push({userEnteredValue: {stringValue:
      requests.push({
        updateCells: {
          start: {sheetId: 2034869686, rowIndex: 104, columnIndex: 38},
          //Metrics**!AM105
          rows: rows,
          //fields: 'userEnteredValue,userEnteredFormat.backgroundColor'
          fields: 'userEnteredValue'
        }
      });
      sheets.spreadsheets.batchUpdate({
        auth: auth,
        spreadsheetId: '1qiRQ8-ZFqriV6F3ARGDcT9wi19f3ISIaZ4lbsT7ZGJk',
        resource: {requests: requests}
      }, (err, response) => {

        if (err) return console.log(err);
      })
    });

  });
}


