
const http = require('http');
const xmlParseString = require('xml2js').parseString;
const JSONAPI = require('./JSONAPI');
const Item = require('./Item');

class Shipment extends JSONAPI {
  constructor(shipment) {
    super();
    Object.assign(this, shipment);
    if (this.contents)
      this.contents = new Item(this.contents);
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "shipments",
      pkey: "id",
      fields: ["from_id", "to_id", "contents", "requested", "packed", "received", "store_id", "email", "props", "payments", "tracking_code", "address"]
    };
  }

  lookupTracking(callback) {
    if (!this.tracking_code || this.tracking_code=='')
      return callback(null);

      let self = this;
      let request = http.request({
          method: 'GET',
          hostname: 'production.shippingapis.com',
          path: encodeURI(`/ShippingAPI.dll?API=TrackV2&XML=<?xml version="1.0" encoding="UTF-8" ?><TrackRequest USERID="717BOWDR0178"><TrackID ID="${this.tracking_code}"></TrackID></TrackRequest>`)
        }, function (result) {
          result.setEncoding('utf8');
          let tracking_data = '';
          result.on('data', function(data) {
            tracking_data += data;
          });
          result.on('end', function() {
            xmlParseString(tracking_data, (err, tracking) => {
              if (err) return callback(err);
              let description = "";
              try {
                // usps api gives us back a text string, how lovely
                description = tracking.TrackResponse.TrackInfo[0].TrackSummary[0];
              } catch (err) {
                return callback({error: "unhandled response from USPS tracking",response: tracking});
              }
              if (/ delivered /.test(description) && !/ not be delivered/.test(description)) {
                let matches = description.match(/ ([0-9]+):([0-9]+) (.m) on ([^\s]+ [^\s]+ [^\s]+)/);
                if (!matches) {
                  console.log("unknown USPS state: "+description)
                  return callback(null);
                }
                // FIXME add daylight savings time handling
                let hour = parseInt(matches[1]) + (matches[3]=='pm'?12:0) - (matches[1]=='12'?12:0);
                let min = matches[2];
                let day = matches[4];
                let date = new Date(`${day} ${hour}:${min} EST`).getTime();
                if (!isNaN(date))
                  self.received = date/1000;
              } // description says "delivered"
              return callback(null);
            }); // parse xml string
          });
        }
      );
      request.on('error', function(err) {console.log(err);});
      request.end();

  }
}

module.exports = Shipment;
