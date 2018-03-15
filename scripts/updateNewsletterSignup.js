
require('node-jsx-babel').install();
require('dotenv').config();

const async = require('async');
const Signup = require('../models/Signup');
const User = require('../models/User');

let queries = [];

Signup.getAll({
  page: {
    direction: "DESC",
    sort: "time",
  },
}, (err, signups) => {
  if (err || !signups) return console.log(err);
  signups.forEach((signup) => {
    if (!signup.id.newsletter || !Signup.isEmail(signup.id.email)) return;
    let user = new User({
      email: signup.id.email.trim().toLowerCase(),
      props: {
        newsletter: signup.time,
      },
    });

    queries.push(function(query_callback) {
      user.upsert((err)=>{
        query_callback(err);
      });
    });
  });

  async.series(queries, function(err, data) {
    console.log(`updated ${data.length} entries`);
    if (err) console.log(err)
    process.exit();
  });
});

