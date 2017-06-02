
const GoogleSheets = require('./GoogleSheets.js');

const spreadsheet_id_emails = '1Fx2iZxXQqkIQboRXHz5y3ZI6bxKFRCGbCrRl277a_zQ';

/***
Handle requests to "/spreadsheetemails/new" for legacy email collection
***/
class SpreadsheetEmails {
  constructor() {
    this.sheets = new GoogleSheets(spreadsheet_id_emails);
  }


  handleHTTP(req, res, next) {
    // ignore if not for us
    if (req.path_tokens[0]!=this.constructor.name.toLowerCase())
      return next();

    if (req.path_tokens[1]=="new") {
      if (!req.query.email) return res.json({error:"no email specified"});

      //this.sheets.init((err, auth) => {
        this.sheets.query('Sheet1!A1:A10', (err, response) => {
          if (err) return res.json({error:'The API returned an error: '+err});
          if (!response.values) return res.json({error: "unable to query existing sheet"});

          // start below the last entry
          let start = {
            sheetId: 0,
            rowIndex: response.values.length,
            columnIndex: 0,
          }
          let rows = [[new Date().toString(), req.query.email, req.query.capture]];
          this.sheets.update(start, rows, (err) => {
            if (err) console.info(err);
            return res.json({rows});
          });
        });
      //});
    }
  }
}

module.exports = SpreadsheetEmails;
