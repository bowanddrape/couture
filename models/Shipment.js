
const http = require('http');
const xmlParseString = require('xml2js').parseString;

const JSONAPI = require('./JSONAPI');
const Item = require('./Item');
const Address = require('./Address');
const ShipProvider = require('./ShipProvider.js');
const Page = require('./Page');
const ShipmentView = require('../views/Shipment.jsx');
const FulfillmentStickers = require('../views/FulfillmentStickers.jsx');
const SQLTable = require('./SQLTable.js');
const Facility = require('./Facility.js');

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
      fields: ["from_id", "to_id", "contents", "ship_by", "delivery_promised", "requested", "on_hold", "approved", "picked", "inspected", "packed", "received", "ship_description", "store_id", "email", "props", "payments", "tracking_code", "shipping_label", "address", "billing_address", "fulfillment_id", "shipping_label_created", "shipping_carrier_pickup"]
    };
  }

  // estends SQLTable
  upsert(callback) {
    super.upsert((err, result) => {
      if (callback) {
        callback(err, result);
      }
      SQLTable.sqlExec("REFRESH MATERIALIZED VIEW inventory", [], (err) => {
        if (err)
          console.log("error updating inventory view "+err);
      });
    });
  }

  // extends JSONAPI
  hasApiPermission(req, res) {
    // allow user to ask for own shipments
    // FIXME only allow user to look at own shipments
    if (req.method=='GET' && req.user)
      return true;

    // allow anyone to get shipping quote
    if (req.path=="/shipment/quote")
      return true;

    return super.hasApiPermission(req, res);
  }

  // extends JSONAPI
  handleHTTPPage(req, res, next) {
    if (req.path_tokens.length < 2)
      return Page.renderNotFound(req, res);

    return Shipment.get(req.path_tokens[1], (err, shipment) => {
      if (err || !shipment) return Page.renderNotFound(req, res);
      if (req.path_tokens[2]=="stickers")
        return Page.render(req, res, FulfillmentStickers, {shipments:[shipment]});
      Page.render(req, res, ShipmentView, shipment);
    });
  }

  // extends JSONAPI
  onApiGet(req, res) {
    // get list of shipments by tag
    if (/\/shipment\/tagged/.test(req.path)) {
      let tag = req.query.tag;
      let query = `WITH shipment_contents AS (SELECT *, jsonb_array_elements(contents) AS content_array FROM shipments WHERE props#>>'{imported}' IS NULL ORDER BY ship_by ASC) SELECT * FROM shipment_contents WHERE content_array->'tags' ? $1`;
      return SQLTable.sqlQuery(Shipment, query, [tag], (err, shipments) => {
        // remove an extra field we made just for the db select
        if (shipments) {
          shipments.forEach((shipment) => {
            delete shipment.content_array;
          });
        }
        res.json(shipments);
      });
    }

    super.onApiGet(req, res);
  }

  // extends JSONAPI
  onApiSave(req, res, object, callback) {
    // if this was a request for shipping rates, return that instead
    if (req.path=="/shipment/quote") {
      if (object.id) {
        return this.constructor.get(object.id, (err, shipment) => {
          if (err) return res.status(400).json({error:err});
          ShipProvider.quote(shipment, (err, rates) => {
            if (err) return res.status(400).json({error:err});
            res.json(rates);
          });
        });
      } // has shipment.id

      if (!object.contents || !object.address)
        return res.status(400).json({error:"malformed shippingrate query"});

      return ShipProvider.quote(object, (err, rates) => {
        if (err) return res.status(400).json({error:err});
        res.json(rates);
      });
    } // /shipment/quote

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

    // edit tags on shipment contents
    if (req.path=="/shipment/tagcontent") {
      let update_tags_tasks = []
      // first get inital content
      update_tags_tasks.push((client, callback) => {
        let query = `SELECT * FROM shipments WHERE id=$1 LIMIT 1`;
        client.query(query, [object.id], (err, result) => {
          if (err) return callback(err);
          if (!result.rows.length) return callback("no such shipment");
          let shipment = new Shipment(result.rows[0]);
          // default inputs
          object.content_index = object.content_index || 0;
          if (object.content_index=='*') {
            object.content_index = Array.apply(null, {length: shipment.contents.filter((item)=>{return item.sku}).length}).map(Number.call, Number);
            // legacy items don't have skus
            if (shipment.props && shipment.props.imported=="haute") {
              object.content_index = Array.apply(null, {length: shipment.contents.length}).map(Number.call, Number);
            }
          }
          if (typeof(object.content_index)=="number" || typeof(object.content_index)=="string")
            object.content_index = [parseInt(object.content_index)];
          object.add_tags = new Set(object.add_tags);
          object.remove_tags = new Set(object.remove_tags);
          if (!shipment.contents || shipment.contents.length<=object.content_index.reduce((a,b)=>{return Math.max(a,b)}))
            return callback(err)
          object.content_index.forEach((content_index) => {
            let content = shipment.contents[content_index];
            let tags = new Set(content.tags);
            tags = new Set([...tags, ...object.add_tags]);
            tags = new Set([...tags].filter(x=>!object.remove_tags.has(x)));
            shipment.contents[content_index].tags = Array.from(tags);
          });

          callback(err, client, shipment);
        });
      });
      // update the db
      update_tags_tasks.push((client, shipment, callback) => {
        let query = `UPDATE shipments SET contents=$1 WHERE id=$2`;
        client.query(query, [JSON.stringify(shipment.contents), shipment.id], (err, result) => {
          if (err) return callback(err);

          // compare against tags we care about like 'needs_picking', etc;
          let stationTags = new Set(["new", "on_hold", "needs_airbrush", "needs_embroidery", "at_airbrush", "at_embroidery", "needs_stickers", "needs_picking", "needs_pressing", "needs_qaing", "needs_packing", "shipped", "remake"]);

          // Add a new row in the metrics table if a stationTag is removed
          if (object.remove_tags.size > 0){
            let rTag = object.remove_tags.values().next();
            if (stationTags.has(rTag.value)){
              let metricsQuery = 'INSERT INTO metrics (props) VALUES($1)';
                let index = '*';
                if (object.content_index != '*') {
                  index = (object.content_index == 0 ? 0: object.content_index - 1);
                }
                let values = {
                user: req.user.email,
                tag: rTag.value,
                shipment_id: shipment.id,
                content_index: index,
              };
              return client.query(metricsQuery, [values], (err, result) => {
                if (err) return callback(err);
                res.json(shipment);
                callback(null);
              });
            }
          }
          // Proceed as usual if a tag we don't care about is removed
          res.json(shipment);
          callback(null);
        });
      });

      let onError = (err) => {
        res.json({error: err}).end();
      }
      return SQLTable.sqlExecTransaction(update_tags_tasks, onError);
    } // shipment/tagcontent

    // If there's an api call to approve this for production, do extra steps
    // TODO in the future check if we already have a fulfillment_id
    if (object.id && object.approved){
      let query = "UPDATE shipments SET (approved, fulfillment_id) = ($1, (SELECT fulfillment_id FROM shipments WHERE fulfillment_id IS NOT NULL ORDER BY fulfillment_id DESC LIMIT 1) + 1) WHERE id=$2 AND fulfillment_id IS NULL RETURNING *"
      return SQLTable.sqlExec(query, [object.approved, object.id], (err, result) => {
        if (err) return res.json({error:err});
        if (!result.rows.length) return super.onApiSave(req, res, object, callback);
        let next_fulfillment_id = result.rows[0].fulfillment_id || 1;
        object.fulfillment_id = next_fulfillment_id;
        // We can remove this bit once all stores are marking their from_id's
        // check object store id and assign the appropriate from_id for now
        let store_id = result.rows[0].store_id;
        if (store_id == 'd955f9f3-e9ae-475a-a944-237862b589b3'){
          // check if our store is the VSS store
          object.from_id = Facility.special_ids["vss"]
        }
        else {
          // Assign 216 as there are no other stores currently
          object.from_id = Facility.special_ids["216"];
        }
        super.onApiSave(req, res, object, callback);
      });
    };

    super.onApiSave(req, res, object, callback);
  }

  // lookup USPS tracking state, updating ourselves if we were delivered
  lookupTracking(callback) {
    let self = this;

    // helper function to try and capture a time
    let parseDateFromText = (text) => {
      // FIXME add daylight savings time handling?
      let matches = text.match(/ ([0-9]+):([0-9]+) (.m) on ([^\s]+ [^\s]+,? [^\s]+)/);
      if (matches) {
        let hour = parseInt(matches[1]) + (matches[3]=='pm'?12:0) - (matches[1]=='12'?12:0);
        let min = matches[2];
        let day = matches[4];
        return new Date(`${day} ${hour}:${min} EST`);
      }

      matches = text.match(/([^\s]+ [^\s]+, [^\s]+),?( at)? ([0-9]+):([0-9]+) (.m)/);
      if (matches) {
        let hour = parseInt(matches[3]) + (matches[5]=='pm'?12:0) - (matches[3]=='12'?12:0);
        let min = matches[4];
        let day = matches[1];
        return new Date(`${day} ${hour}:${min} EST`);
      }
      console.log("could not parse date from USPS state: "+text)
      return null;
    };

    if (!this.tracking_code || this.tracking_code=='')
      return callback(null);

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
            let description = "";
            let detail = [];
            try {
              // usps api gives us back a text string, how lovely
              description = tracking.TrackResponse.TrackInfo[0].TrackSummary[0];
              detail = tracking.TrackResponse.TrackInfo[0].TrackDetail;
            } catch (err) {
            }

            // save the shipping description
            if (description && !/could not locate the tracking information/.test(description))
              self.ship_description = description;

            // extract delivered date
            if (
              (/ delivered /.test(self.ship_description) && !/ not be delivered/.test(self.ship_description))
              || / was picked up /.test(self.ship_description)
            ) {
              let date = parseDateFromText(self.ship_description);
              if (date && !isNaN(date.getTime()))
                self.received = date.getTime()/1000;
            } // description says "delivered"

            if (detail) {
              detail.forEach((shipping_detail, index) => {
                // extract shipping label created date
                if (/Shipping Label Created/.test(shipping_detail)) {
                  let date = parseDateFromText(shipping_detail);
                  if (date && !isNaN(date.getTime()))
                    self.shipping_label_created = date.getTime()/1000;
                }
                // extract shipping carrier pickup date
                if (index+1 < shipping_detail.length) {
                  let date = parseDateFromText(shipping_detail);
                  if (date && !isNaN(date.getTime()))
                    self.shipping_carrier_pickup = date.getTime()/1000;
                }
              });
            }

            return callback(null);
          }); // parse xml string
        });
      }
    );
    request.on('error', function(err) {console.log("Shipment::lookupTracking "+err);});
    request.end();
  }

}

module.exports = Shipment;
