
const React = require('react');

/***
Display an announcement banner
***/
class Announcement extends React.Component {

  static preprocessProps(options, callback) {
    const SQLTable = require('../models/SQLTable.js');
    SQLTable.sqlQuery(null, "SELECT text FROM announcements WHERE start<$1 AND stop>$1 LIMIT 1", [Math.round(new Date().getTime()/1000)], (err, result) => {
      if (!err && result.rows.length)
        return callback(null, {text:result.rows[0].text});
      callback (null, {});
    });
  }

  render() {
    if (!this.props.text)
      return null;

    let style = {
      color: "#fff",
      backgroundColor: "#ff5c5c",
      width: "100%",
      textAlign: "center",
      fontFamily: "zurichbold_condensed",
      padding: "5px 0px",
    };
    return (
      <div className="announcement" style={style}>
        <div style={{fontFamily: "zurichbold_condensed"}} dangerouslySetInnerHTML={{__html:`
          ${this.props.text}
        `}} />
      </div>
    )
  }
}

module.exports = Announcement;
