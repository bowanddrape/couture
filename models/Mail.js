
const sendmail = require('sendmail')({
  logger: {
    debug: ()=>{},
    info: ()=>{},
    warn: ()=>{},
    error: console.error
  },
  silent: true,
  dkim: false/*{ // TODO we need this 
    privateKey: fs.readFileSync('./dkim-private.pem', 'utf8'),
    keySelector: 'mydomainkey'
  },
*/
});

class Mail {

  static send(to, subject, html, callback) {
    let options = {
      from: 'no-reply@bowanddrape.com',
      to: to,
      subject: subject,
      html: html,
    };

    sendmail(options, function(err, reply) {
      if (err) {
        console.log("sendmail error");
        console.log(err && err.stack);
      }
      if (callback) callback(err, reply);
    });
  }

}

module.exports = Mail;
