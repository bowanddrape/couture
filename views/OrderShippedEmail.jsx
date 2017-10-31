
const React = require('react');
const Items = require('./Items.jsx');
const styles = require('./EmailStyles.js');

/***
Transactional email. Send this when an order is shipped
***/
class OrderShippedEmail extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <table align="center" style={{width:"100%"}}><tbody>
        <tr><td>
          <h1 style={styles.h1}>YOUR ORDER</h1>
          <h1 style={styles.h1}>HAS LEFT THE BUILDING</h1>
          <img src={"https://couture.bowanddrape.com/Icon-Envelope-Red-Hearts.png"} style={{width:"150px",margin:"auto",display:"block"}}/>
          <div style={{textAlign:"center"}}>
            <div style={styles.text}>Click (and obsessively keep clicking) below</div>
            <div style={styles.text}>to track your package</div>
          </div>
          <a href={this.props.tracking_link} style={styles.button}>
            LOVE TRACK, BABY!
          </a>
        </td></tr>
      </tbody></table>
    );
  }
}


module.exports = OrderShippedEmail;
