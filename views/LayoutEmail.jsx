

const React = require('react');
const styles = require('./EmailStyles.js');

const reasons_to_contact_us = [
  'Do it even if you just want to say "Heyyyy!" Srsly tho. We get lonely sometimes...',
  'Even if the question is "Would you rather have a free wifi forever or a lifetime supply of pizza?" Srsly. Ask us anything!',
  "Do it just to be sure we're still alive and haven't yet died gloriously in battle against the patriarchy",
];

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
              {/* do we want any sort of header? */}
              {/*<tr><td style={{width: "100%", margin: "auto"}}>
                <a href="http://www.bowanddrape.com"><img src="https://couture.bowanddrape.com/logo.jpg" alt="" style={{maxWidth: "300px", margin:"auto", display:"block"}} /></a>
              </td></tr>*/}
              <tr><td>
                {content}
              </td></tr>
              <tr><td>
              <div style={styles.text}>If you have any questions please <a href="https://couture.bowanddrape.com/contact">contact us</a></div>
              <div style={styles.text}>{reasons_to_contact_us[Math.floor(Math.random()*reasons_to_contact_us.length)]}</div>
              <div style={Object.assign({}, styles.text, {marginTop: "20px"})}>Xx,</div>
              <div style={Object.assign({}, styles.text, {marginTop: "10px",marginBottom: "20px"})}>The Bow & Drape Team</div>
              </td></tr>
              {/*TODO needs an unsubscribe link*/}
              <tr><td style={{width: "100%", maxWidth: "600px", backgroundColor: "#F5C9CA"}}>
                <table style={{width:"100%", align:"center"}}><tbody><tr>
                  <td style={{textAlign:"right"}}>Follow & Share:</td>
                  <td style={{textAlign:"center"}}><a href="https://www.instagram.com/bowanddrape/"><img src="https://couture.bowanddrape.com/instagram.png" alt="instagram" /></a></td>
                  <td style={{textAlign:"center"}}><a href="https://www.instagram.com/bowanddrape/"><img src="https://couture.bowanddrape.com/facebook.png" alt="facebook" /></a></td>
                  <td style={{textAlign:"center"}}><a href="https://twitter.com/bowanddrape"><img src="https://couture.bowanddrape.com/twitter.png" alt="twitter" /></a></td>
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

module.exports = LayoutEmail;
