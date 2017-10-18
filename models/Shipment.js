
const http = require('http');
const xmlParseString = require('xml2js').parseString;

const JSONAPI = require('./JSONAPI');
const Item = require('./Item');
const Address = require('./Address');
const ShipProvider = require('./ShipProvider.js');
const Page = require('./Page');
const ShipmentView = require('../views/Shipment.jsx');
const SQLTable = require('./SQLTable.js');
var aws = require('aws-sdk');
var s3 = new aws.S3({ accessKeyId: process.env.AWS_ACCESS_KEY, secretAccessKey: process.env.AWS_SECRET_KEY, region: process.env.AWS_REGION })


/***
A shipment is any transfer of parts/components/products between facilities
This model also handles shipping API integrations
***/
class Shipment extends JSONAPI {
  constructor(shipment) {
    super();
    Object.assign(this, shipment);
    if (this.contents)
      this.contents = new Item(this.contents);
    if (this.address)
      this.address = new Address(this.address);
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "shipments",
      pkey: "id",
      fields: ["from_id", "to_id", "contents", "delivery_promised", "requested", "on_hold", "approved", "picked", "inspected", "packed", "received", "ship_description", "store_id", "email", "props", "payments", "tracking_code", "shipping_label", "address", "billing_address", "fulfillment_id"]
    };
  }

  // extends JSONAPI
  hasApiPermission(req, res) {
    // allow user to ask for own shipments
    if (req.method=='GET' && req.user && req.user.email==req.query.email)
      return true;

    return super.hasApiPermission(req, res);
  }

  // extends JSONAPI
  handleHTTPPage(req, res, next) {
    if (req.path_tokens.length < 2)
      return Page.renderNotFound(req, res);
    return Shipment.get(req.path_tokens[1], (err, shipment) => {
      if (err || !shipment) return Page.renderNotFound(req, res);
      Page.render(req, res, ShipmentView, shipment);
    });
  }

  // extends JSONAPI
  onApiSave(req, res, object, callback) {
    // TODO in the future check if we already have a fulfillment_id
    if (object.id && object.approved){
        let s = "UPDATE shipments SET (approved, fulfillment_id) = ($1, (SELECT fulfillment_id FROM shipments WHERE fulfillment_id IS NOT NULL ORDER BY fulfillment_id DESC LIMIT 1) + 1) WHERE id=$2 RETURNING *"
        return SQLTable.sqlExec(s, [object.approved, object.id], (err, result) => {
        if (err) {
          console.log(err);
          return callback(err);
        }
        let next_fulfillment_id = result.rows[0].fulfillment_id || 1;
        object.fulfillment_id = next_fulfillment_id;
        super.onApiSave(req, res, object, callback);
        });
    };

    // if this was a request for shipping rates, return that instead
    if (req.path=="/shipment/quote") {
      return this.constructor.get(object.id, (err, shipment) => {
        if (err) return res.status(400).json({error:err});
        ShipProvider.quote(shipment, (err, rates) => {
          if (err) return res.status(400).json({error:err});
          res.json(rates);
        });
      });
    }

    // if this was a request to buy a label, do that
    if (req.path=="/shipment/buylabel") {
      return this.constructor.get(object.id, (err, shipment) => {
        if (shipment.tracking_code)
          return res.status(400).json({error:'shipment already has tracking code'});
        ShipProvider.buyLabel(shipment, object.rate_id, (err, shipment) => {
          if (err) return res.status(400).json({error:err});
          res.json(shipment);
        });
      });
    }
    super.onApiSave(req, res, object, callback);
  }

  // lookup USPS tracking state, updating ourselves if we were delivered
  lookupTracking(callback) {
    if (!this.tracking_code || this.tracking_code=='')
      return callback(null);

      let self = this;
      let request = http.request({
          method: 'GET',
          hostname: 'production.shippingapis.com',
          path: encodeURI(`/ShippingAPI.dll?API=TrackV2&XML=<?xml version="1.0" encoding="UTF-8" ?><TrackRequest USERID="717BOWDR0178"><TrackID ID="${this.tracking_code}"></TrackID></TrackRequest>`)
        }, (result) => {
          result.setEncoding('utf8');
          let tracking_data = '';
          result.on('data', (data) => {
            tracking_data += data;
          });
          result.on('end', () => {
            xmlParseString(tracking_data, (err, tracking) => {
              if (err) return callback(err);
              let description = "";
              try {
                // usps api gives us back a text string, how lovely
                description = tracking.TrackResponse.TrackInfo[0].TrackSummary[0];
              } catch (err) {
                return callback({error: "unhandled response from USPS tracking",response: tracking});
              }
              if (!/could not locate the tracking information/.test(description))
                this.ship_description = description;
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
