
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

/***
Log a message. Currently goes to Slack
***/
class Log {

  static message(msg, callback) {
    callback = callback || function(err){
      if (err) console.info(err);
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
    slack_notify.on('error', function(err) {console.info(err);});
    slack_notify.end(JSON.stringify({
      as_user: false,
      username,
      icon_emoji: ":moneybag:",
      text: msg,
    }));
  }
}

Log.username = username;
Log.slackbot = slackbot;
Log.listen = listen;
module.exports = Log;

