
const https = require('https');

class Log {
  static message(msg) {
    let slack_notify = https.request({
        protocol: 'https:',
        method: 'POST',
        hostname: 'hooks.slack.com',
        path: `/services/T0928RSGP/B2TUE537X/mko0Fs5coag6qzjCtc0T28VW`
      }, (result) => {}
    );
    slack_notify.on('error', function(err) {console.log(err);});
    slack_notify.end(JSON.stringify({
      as_user: false,
      username: "couture",
      icon_emoji: ":moneybag:",
      text: msg,
    }));
  }
}
module.exports = Log;

