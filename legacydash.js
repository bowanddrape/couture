
const mysql = require('mysql');
const server = require('http').createServer();
const async = require('async');
const express = require('express');
const app = express();

const connection = mysql.createConnection({
  host     : 'mysqldb.cpb9sj1nzvlm.us-east-1.rds.amazonaws.com',
  user     : 'zoora',
  password : 'zoora121!',
  database : 'zoora'
});
 
connection.connect();

let queries = [
  function(callback) {
    connection.query("SELECT sum(product_price) FROM orders WHERE created_at > CONVERT_TZ('2016-11-08 00:00:00','EST','UTC') AND (status='In Progress' OR status='Shipped')", function(err, rows, fields) {
      callback(err, rows[0]['sum(product_price)']);
    });
  },
  function(callback) {
    let date = new Date();
    connection.query(`SELECT sum(product_price) FROM orders WHERE created_at > CONVERT_TZ('2016-${date.getMonth()+1}-${date.getDate()} 00:00:00','EST','UTC') AND (status='In Progress' OR status='Shipped')`, function(err, rows, fields) {
      callback(err, rows[0]['sum(product_price)']);
    });
  },
]

app.use(function(req, res, next) {
  async.series(queries, function(err, data) {
    if (err) return console.log(err);
   
    res.end(`
      <html>
      <link href="https://fonts.googleapis.com/css?family=Abril+Fatface" rel="stylesheet"> 
      <style>
        html {
          background-color: #000;
        }
        container {
          display: flex;
          justify-content: space-around;
          align-items: center;
          width: 100%;
          height: 100%;
          text-align: center;
          font-family: 'Abril Fatface', cursive;
          color: #fff;
        }
        container div {
          height: 200px;
        }
        heading {
          display: block;
          font-size: 40px;
          color: #aaa;
        }
        score {
          margin_top: 30px;
          display: block;
          font-weight: bold;
          font-size: 50px;
        }
      </style>
      <container>
        <div>
          <heading>Today's Sales</heading>
          <score>$${data[1]}</score>
        </div>
        <div>
          <heading>Current Total</heading>
          <score>$${data[0]}</score>
          <score>${Math.round(data[0]/275000*10000)/100}%</score>
        </div>
      </container>
      <script>
        setTimeout(function(){location.reload()}, 30000);
      </script>
      </html>

    `);
  });
});

server.on('request', app);
server.listen(1000, function () {
});
