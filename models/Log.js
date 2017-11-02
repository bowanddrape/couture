
const os = require('os');
const https = require('https');
const EventEmitter = require('events');
let listen = new EventEmitter();

const username = "couture_"+os.hostname();
const regex_username = new RegExp(`@${username}`);

// FIXME we need to catch connection exceptions to slack because this kills us
const slack = require('slack')
const slackbot = slack.rtm.client();
slackbot.started((reconnect) => {
  // TODO handle errors and reconnect
  //slackbot.ws.[how does this detect errors?];
});
slackbot.message((message) => {
  // ignore messages from bots
  if (message.subtype=="bot_message") return;
  // ignore messages that didn't have an @mention of us
  if (!regex_username.test(message.text)) return;
  // send to event dispatcher
  listen.emit("message", message.text);
});
const token = process.env.SLACK_TOKEN;
// connect to slack RTM for messages
slackbot.listen({token});

// setup connection to influxdb for timeseries logging
const Influx = require('influx');
const influx = new Influx.InfluxDB({
  host: process.env.INFLUX_HOST,
  database: 'couture_'+process.env.ENV,
  schema: [
    {
      measurement: 'webserver_response_time',
      fields: {
        path: Influx.FieldType.STRING,
        value: Influx.FieldType.INTEGER,
      },
      tags: [
        'host',
        'status',
        'user_email',
      ]
    }
  ]
})

/***
Log a message. Currently goes to Slack
***/
class Log {

  static message(msg, callback) {
    callback = callback || function(err){
      if (err) console.info("Log::message "+err);
    };
    slack.chat.postMessage({
      token,
      as_user: false,
      username,
      channel: "#technology",
      icon_emoji: ":moneybag:",
      text: msg,
    }, callback);
  }

  static slackWebhookMessage(msg) {
    // TODO we NEED ratelimiting here or we risk disabling the slack webhook
    let slack_notify = https.request({
        protocol: 'https:',
        method: 'POST',
        hostname: 'hooks.slack.com',
        path: `/services/T0928RSGP/B2TUE537X/mko0Fs5coag6qzjCtc0T28VW`
      }, (result) => {}
    );
    slack_notify.on('error', function(err) {console.info("Log::slackWebhoockMessage "+err);});
    slack_notify.end(JSON.stringify({
      as_user: false,
      username,
      icon_emoji: ":moneybag:",
      text: msg,
    }));
  }

  static webserverResponse(req, res, time) {
    influx.writePoints([
      {
        measurement: 'webserver_response_time',
        tags: {
          host: os.hostname(),
          status: res.statusCode,
          user_email: req.user?req.user.email:null,
        },
        fields: {
          path: req.path,
          value: time,
        },
      }
    ]).catch((reason) => {
      console.log("Log.webserverResponse error "+reason);
    });
  }

  static handleHTTP(req, res, next) {
    if (req.path_tokens[0]!='log')
      return next();
    if (!req.query.measurement)
      return res.status(404).json({error:"no measurement specified"});
    if (!req.query.time_start)
      return res.status(404).json({error:"no time_start specified"});
    if (!req.query.time_interval)
      return res.status(404).json({error:"no time_interval specified"});

    let where = [];
    for (let key in req.query) {
      if (["measurement", "time_interval"].indexOf(key)>=0)
        continue;
      if (key=="time_start") {
        where.push(`time>=${req.query[key]}`);
        continue;
      }
      if (key=="time_stop") {
        where.push(`time<=${req.query[key]}`);
        continue;
      }
      where.push(`${key}=${req.query[key]}`);
    }

    let query = `
      select mean(value), count(value) from ${req.query.measurement}
      where ${where.join(" and ")}
      group by time(${req.query.time_interval})
    `;

    influx.query(query).then((rows) => {
      res.json(rows);
    }).catch((reason) => {
      console.log("Log::handleHTTP "+reason.toString());
      return res.status(500).end(reason);
    });
  }

}

Log.username = username;
Log.slackbot = slackbot;
Log.listen = listen;
module.exports = Log;

