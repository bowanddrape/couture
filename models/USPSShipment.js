
const http = require('http');
const https = require('https');
const fs = require('fs');
const xmlParseString = require('xml2js').parseString;
const Shipment = require('./Shipment');
var aws = require('aws-sdk');
var s3 = new aws.S3({ accessKeyId: process.env.AWS_ACCESS_KEY, secretAccessKey: process.env.AWS_SECRET_KEY, region: process.env.AWS_REGION })

/***
Shipment object I mistakenly hooked up to the USPS api
The USPS api is useless and does not allow you to create prepaid shipping labels
***/
class USPSShipment extends Shipment {

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

  getLabel(callback) {
    if (this.tracking_code)
      return callback('already has tracking code');

    let self = this;
    let usps_api_endpoint = (process.env.ENV=='prod') ?
      "DeliveryConfirmationV4" :
      "DelivConfirmCertifyV4";
    let request_options = {
        method: 'GET',
        hostname: 'secure.shippingapis.com',
        path: encodeURI(`/ShippingAPI.dll?API=${usps_api_endpoint}&xml=<?xml version="1.0" encoding="UTF-8" ?><${usps_api_endpoint}.0Request USERID="717BOWDR0178"><Option>1</Option><ImageParameters><LabelSequence><PackageNumber>1</PackageNumber><TotalPackages>1</TotalPackages></LabelSequence></ImageParameters><FromName>Bow and Drape</FromName><FromFirm></FromFirm><FromAddress1>Suite 503</FromAddress1><FromAddress2>588 Broadway</FromAddress2><FromCity>New York</FromCity><FromState>NY</FromState><FromZip5>10012</FromZip5><FromZip4></FromZip4><ToName>${this.address.name}</ToName><ToFirm></ToFirm><ToAddress1>${this.address.apt}</ToAddress1><ToAddress2>${this.address.street}</ToAddress2><ToCity>${this.address.locality}</ToCity><ToState>${this.address.region}</ToState><ToZip5>${this.address.postal}</ToZip5><ToZip4></ToZip4><WeightInOunces>2</WeightInOunces><ServiceType>Priority</ServiceType><InsuredAmount></InsuredAmount><SeparateReceiptPage></SeparateReceiptPage><POZipCode></POZipCode><ImageType>TIF</ImageType><LabelDate></LabelDate><CustomerRefNo></CustomerRefNo><AddressServiceRequested></AddressServiceRequested><SenderName></SenderName><SenderEMail></SenderEMail><RecipientName></RecipientName><RecipientEMail></RecipientEMail><Container>Variable</Container><Size>Regular</Size><CommercialPrice>False</CommercialPrice></${usps_api_endpoint}.0Request>`)
      };
    let request = https.request(request_options,
      function (result) {
        result.setEncoding('utf8');
        let tracking_data = '';
        result.on('data', function(data) {
          tracking_data += data;
        });
        result.on('end', function() {
          xmlParseString(tracking_data, (err, tracking) => {
            if (err) return callback(err);
            if (tracking.Error) return callback(tracking.Error);
            self.tracking_code = tracking[`${usps_api_endpoint}.0Response`].DeliveryConfirmationNumber[0];

/*            fs.writeFile("./test.tif", tracking[`${usps_api_endpoint}.0Response`].DeliveryConfirmationLabel, {encoding:'base64'}, (err) => {
              return callback(err);
            });*/

            // upload to aws S3
            let buffer = Buffer.from(tracking[`${usps_api_endpoint}.0Response`].DeliveryConfirmationLabel[0], 'base64');
            let s3_options = {
              Bucket: 'www.bowanddrape.com',
              Key: ((process.env.ENV=='prod')?'':'staging/')+'shipments/'+self.id+'_packing.tif',
              Body: buffer,
              ACL: 'public-read',
              ContentDisposition: `attachment; filename=${self.id}_packing.tif`,
            };
            s3.putObject(s3_options, (err) => {
              if (err) return callback(err);
              self.shipping_label = `https://s3.amazonaws.com/${s3_options.Bucket}/${s3_options.Key}`;
              self.upsert(callback);
            }); 
          }); // parse xml string
        });
      }
    );
    request.on('error', function(err) {callback(err);});
    request.end();
  }
}

module.exports = USPSShipment;
