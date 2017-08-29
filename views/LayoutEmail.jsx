

const React = require('react');

/***
Use this layout when rendering an email
props:
  content_string // body of email
***/
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
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style={styles.body}>
        <center style={styles.wrapper}>
          <div style={styles.innerwrapper}>
            <table style={styles.table} className="outer"><tbody>
              <tr><td style={{width: "100%", margin: "auto"}}>
                <a href="http://www.bowanddrape.com"><img src="http://staging.bowanddrape.com/logo.jpg?cachebust=1" alt="" style={{maxWidth: "300px", margin:"auto", display:"block"}} /></a>
              </td></tr>
              <tr><td>
                {content}
              </td></tr>
              {/*TODO needs an unsubscribe link*/}
              <tr><td style={{width: "100%", maxWidth: "600px", backgroundColor: "#F5C9CA"}}>
                <table style={{width:"100%", align:"center"}}><tbody><tr>
                  <td style={{textAlign:"right"}}>Follow & Share:</td>
                  <td style={{textAlign:"center"}}><a href="https://www.instagram.com/bowanddrape/"><img src="http://staging.bowanddrape.com/instagram.png" alt="instagram" /></a></td>
                  <td style={{textAlign:"center"}}><a href="https://www.instagram.com/bowanddrape/"><img src="http://staging.bowanddrape.com/facebook.png" alt="facebook" /></a></td>
                  <td style={{textAlign:"center"}}><a href="https://twitter.com/bowanddrape"><img src="http://staging.bowanddrape.com/twitter.png" alt="twitter" /></a></td>
                </tr></tbody></table>
              </td></tr>
            </tbody></table>
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
    align: "center",
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
    width: "100%",
    margin: "0 auto",
  },
}

module.exports = LayoutEmail;
