
const pg = require('pg').native;

let pg_pool = new pg.Pool({
  user: 'root',
  password: 'password',
  database: 'couture',
  host: '127.0.0.1',
  port: 5432,
  max: 10,
  idleTimeoutMillis: 1000,
});
pg_pool.on('error', function (err, client) {
  // TODO escalate this
  console.error('pg client error', err.message, err.stack)
})



class SQLTable {

  // run a query, optionally returning an array of the provided model
  // TODO lockdown everything that isn't a select from being run here
  static sqlQuery(model, query, values, callback) {
    pg_pool.connect(function(err, client, done) {
      if(err) return callback(err);

      client.query(query, values, function(err, result) {
        done(); // release connection back to pool
        if(err) {
          // TODO log and escalate
          return callback(err);
        }

        if (model && result.rows.length) {
          let ret = result.rows.map(function(row) {return new model(row)});
          return callback(null, ret);
        }
        return callback(null, result);
      }); // query
    }); // db connection
  } // sqlQuery

  // run a write statement, in the future this will go to master, where
  // as the sqlQuery function will go to a read replica
  static sqlExec(query, values, callback) {
    pg_pool.connect(function(err, client, done) {
      if(err) return callback(err);

      client.query(query, values, function(err, result) {
        done(); // release connection back to pool
        if(err) {
          // TODO log and escalate
          return callback(err);
        }

        return callback(null, result);
      }); // query
    }); // db connection
  } // sqlExec

  // helper function to query an object from the database
  static get(primary_key_value, callback) {
    if (!this.getSQLSettings) return callback("getSQLSettings not defined");
    let sql = this.getSQLSettings();
    let query = `SELECT * FROM ${sql.tablename} WHERE ${sql.pkey}=$1 LIMIT 1`;
    this.sqlQuery(this, query, [primary_key_value], function(err, results) {
      if (err) return callback(err);
      if (!results.length) return callback(null, null);
      callback(null, results[0]);
    });
  }

  // helper function to build a query statement from an object
  static getAll(constraints, callback) {
    if (!this.getSQLSettings) return callback("getSQLSettings not defined");
    let sql = this.getSQLSettings();

    let where = "";
    let values = [];
    let order_by = "";
    let limit = "";

    // build WHERE based on constraints
    for (let column in constraints) {
      // ignore our special "page" object
      if (column == "page") continue;
      if (constraints[column]===null || constraints[column]==="null") {
        where = where ?
          where + ` AND ${column} IS NULL`:
          `WHERE ${column} IS NULL`;
      } else if (constraints[column]==="not_null") {
        // kind of stinky, but still feels like the best way to query this
        where = where ?
          where + ` AND ${column} IS NOT NULL`:
          `WHERE ${column} IS NOT NULL`;
      } else {
        values.push(constraints[column]);
        where = where ?
          where + ` AND ${column}=$${values.length}`:
          `WHERE ${column}=$${values.length}`;
      }
    }

    // pull out reserved keys in constrains
    if (constraints && constraints.page) {
      limit = constraints.page.limit?` LIMIT ${constraints.page.limit}`:"";
      let direction = !constraints.page.direction||constraints.page.direction.toUpperCase()=="DESC"
        ? "DESC"
        : "ASC";
      order_by = constraints.page.sort
        ? ` ORDER BY ${constraints.page.sort} ${direction}`
        : "";
      if (constraints.page.start) {
        let compare = direction=="ASC"?'>':'<';
        values.push(constraints.page.start);
        where = where ?
          where + ` AND ${constraints.page.sort}${compare}$${values.length}`:
          `WHERE ${constraints.page.sort}${compare}$${values.length}`;
      }
    }

    this.sqlQuery(this, `SELECT * FROM ${sql.tablename} ${where}${order_by}${limit}`, values, (err, result) => {
      // if we didn't get anything, return an empty array
      if (err || !result.length) return callback(err, []);
      return callback(null, result);
    });
  }

  upsert(callback) {
    if (!this.constructor.getSQLSettings) return callback("getSQLSettings not defined");
    let sql = this.constructor.getSQLSettings();
    let self = this;
    let buildQueryAndExec = (callback) => {
      // build arrays of columns and values
      let fields = [];
      let substitutions = []
      let values = [];
      sql.fields.splice(0, 0, sql.pkey);
      sql.fields.map((field) => {
        // skip undefined
        if (typeof(self[field])=='undefined') return;
        // skip null
        if (self[field]===null) return;
        fields.push(field);
        substitutions.push('$'+fields.length);
        if (typeof(self[field])=='object') {
          values.push(JSON.stringify(self[field]));
        } else {
          values.push(self[field]);
        }
      });
      let query = `INSERT INTO ${sql.tablename} (${fields.join(',')}) VALUES (${substitutions.join(',')}) ON CONFLICT (${sql.pkey}) DO UPDATE SET (${fields.join(',')}) = (${substitutions.join(',')}) RETURNING ${sql.pkey}`;
      return SQLTable.sqlExec(query, values, callback);
    };

    // if we don't need to deal with properties, just upsert
    if (typeof(this.props)=='undefined') {
      return buildQueryAndExec(callback);
    }

    // otherwise we need to check if other properties existed and merge them
    let query = `SELECT * FROM ${sql.tablename} WHERE ${sql.pkey}=$1 LIMIT 1`;
    SQLTable.sqlQuery(this.constructor, query, [this[sql.pkey]], (err, prev) => {
      if (err) return callback(err);
      // if it existed before, merge props
      if (prev && prev.length) {
        prev[0].props = prev[0].props ? prev[0].props : {};
        this.props = Object.assign(prev[0].props, this.props);
      }
      buildQueryAndExec(callback);
    })
  }

}

module.exports = SQLTable;
