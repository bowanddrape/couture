const fs = require('fs');
const pg = require('pg').native;

var pg_pool = new pg.Pool({
  user: 'root',
  password: 'password',
  database: 'couture',
  host: '127.0.0.1',
  port: 5432,
  max: 10,
  idleTimeoutMillis: 1000,
});

// grab a client from the pool
pg_pool.connect(function(err, client, done) {
  if(err) {
    return console.error('error fetching client from pool', err);
  }

  // create migration table if we don't have one
  client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      filename VARCHAR(32) PRIMARY KEY
    );
  `, function(err, result) {

    client.query('SELECT filename FROM migrations', function(err, result) {
      if(err) {
        done(); return console.error('error running query', err);
      }

      let migrated_filenames = result.rows.map(function(row) {return row.filename;});

      // read migration files
      let migrations = fs.readdirSync(__dirname+'/migrations/');
      for( let i=0; i<migrations.length; i++ ) {
        // ignore non-sql files
        if (!/\.sql$/.test(migrations[i]))
          continue;
        // check if this migration was done already
        if (migrated_filenames.indexOf(migrations[i]) == -1) {
          let sql = fs.readFileSync(__dirname+'/migrations/'+migrations[i], "utf-8");
          console.log("running migration "+migrations[i]+":");
          console.log(sql);
          client.query(sql, function(err) {
            if(err) {
              done(); return console.error('error running query', err);
            }
            client.query('INSERT INTO migrations (filename) VALUES ($$'+migrations[i]+'$$)');
          });
        }
      }

      done();
    }); // query migration table
  }); // create migration table



});

pg_pool.on('error', function (err, client) {
  console.error('pg client error', err.message, err.stack)
})

