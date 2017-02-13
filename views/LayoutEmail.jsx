

const React = require('react');

class LayoutEmail extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    let content = null;
    content = (<div dangerouslySetInnerHTML={{__html:this.props.content_string}} />);

    return (
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title></title>
      </head>
      <body style={styles.body}>
        <center style={styles.wrapper}>
          <div style={styles.innerwrapper}>
            <table style={styles.table} class="outer" align="center">
              <tr><td>
                {content}
              </td></tr>
              {/*TODO needs an unsubscribe link*/}
            </table>
          </div>
        </center>
      </body>
      </html>
    );
  }
}

var styles = {
  body: {
    margin: "0 !important",
    padding: "0",
    backgroundColor: "#ffffff",
  },
  table: {
    borderSpacing: "0",
    fontFamily: "sans-serif",
    color: "#333333",
  },
  td: {
    padding: "0",
  },
  wrapper: {
    width: "100%",
    tableLayout: "fixed",
    textSizeAdjust: "100%",
  },
  innerwrapper: {
    margin: "0 auto",
  },
}

module.exports = LayoutEmail;
