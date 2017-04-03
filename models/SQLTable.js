
const pg = require('pg').native;
const async = require('async');
const Log = require('./Log.js');

let pg_read_pool = new pg.Pool({
  user: process.env.PG_USER,
  password: process.env.PG_PASS,
  database: process.env.PG_DBNAME,
  host: process.env.PG_READ_HOST,
  port: 5432,
  max: 10,
  idleTimeoutMillis: 1000,
});
pg_read_pool.on('error', function (err, client) {
  // TODO escalate this
  console.error('pg client error', err.message, err.stack)
})

let pg_write_pool = new pg.Pool({
  user: process.env.PG_USER,
  password: process.env.PG_PASS,
  database: process.env.PG_DBNAME,
  host: process.env.PG_WRITE_HOST,
  port: 5432,
  max: 10,
  idleTimeoutMillis: 1000,
});
pg_write_pool.on('error', function (err, client) {
  // TODO escalate this
  console.error('pg client error', err.message, err.stack)
})



class SQLTable {

  // run a query, optionally returning an array of the provided model
  // TODO lockdown everything that isn't a select from being run here
  static sqlQuery(model, query, values, callback) {
    pg_read_pool.connect(function(err, client, done) {
      if(err) return callback(err);

      client.query(query, values, function(err, result) {
        done(); // release connection back to pool
        if(err) {
          // TODO escalate?
          console.error(JSON.stringify(err));
          return callback(err);
        }

        if (model) {
          if (!result.rows.length)
            return callback(null, []);
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
    pg_write_pool.connect(function(err, client, done) {
      if(err) return callback(err);

      client.query(query, values, function(err, result) {
        done(); // release connection back to pool
        if(err) {
          // TODO escalate?
          console.error(JSON.stringify(err));
          if (callback) callback(err);
          return;
        }
        if (callback)
          return callback(null, result);
      }); // query
    }); // db connection
  } // sqlExec

  // helper function to query an object from the database
  // TODO maybe update this so that we can have a primary key that is multiple columns? (like for cart)
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
      // special handling for search object
      if (column == "search") {
        if (sql.fields.indexOf("props")>=0) {
          values.push(`.*${constraints[column]}.*`);
          where = where ?
            where + ` AND (props->>'name' ~* $${values.length} OR ${sql.pkey} ~* $${values.length})`:
            `WHERE (props->>'name' ~* $${values.length} OR ${sql.pkey} ~* $${values.length})`;
        }
        continue;
      }
      // parse the rest of constraints into a query
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
      if (err) {
        if (callback) callback(err);
        return;
      }
      // if it existed before, merge props
      if (prev && prev.length) {
        prev[0].props = prev[0].props ? prev[0].props : {};
        this.props = Object.assign(prev[0].props, this.props);
      }
      buildQueryAndExec(callback);
    })
  } // upsert()

  // helper function to delete an object from the database
  remove(callback) {
    if (!this.constructor.getSQLSettings) return callback("getSQLSettings not defined");
    let sql = this.constructor.getSQLSettings();
    if (!this[sql.pkey]) return callback("cannot remove() without primary key");
    let query = `DELETE FROM ${sql.tablename} WHERE ${sql.pkey}=$1`;
    SQLTable.sqlExec(query, [this[sql.pkey]], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  } // remove()


  // ensure that db entries exist for certain prop->names
  static initMandatory(names, callback) {
    if (!this.getSQLSettings) return callback("getSQLSettings not defined");
    let sql = this.getSQLSettings();
    let db_tasks = [];
    names.forEach((name) => {
      db_tasks.push(
        function(callback) {
          let query = `SELECT * FROM ${sql.tablename} WHERE props#>>'{name}'=$1 LIMIT 1;`;
          SQLTable.sqlQuery(null, query, [name], (err, ret) => {
            if (err) return callback(err);
            // if we found it, remember it
            if (ret && ret.rows.length) {
              return callback(null, [name, ret.rows[0].id]);
            }
            // otherwise make a new one
            let query = `INSERT INTO ${sql.tablename} (props) VALUES ($1) RETURNING ${sql.pkey}`;
            SQLTable.sqlExec(query, [{name, admins:["bowanddrape"]}], (err, ret) => {
              callback(null, [name, ret.rows[0].id]);
            });
          }); // query existed
        }
      );
    });
    async.parallel(db_tasks, (err, ret) => {
      if (err) console.log(err);
      let ids = {};
      ret.forEach((name_val) => {
        ids[name_val[0]] = name_val[1];
      });
      if (callback)
        callback(err, ids);
    });
  }

}

module.exports = SQLTable;
