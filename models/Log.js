
const os = require('os');
const https = require('https');

class Log {
  static message(msg) {
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
      username: "couture "+os.hostname(),
      icon_emoji: ":moneybag:",
      text: msg,
    }));
  }
}
module.exports = Log;

