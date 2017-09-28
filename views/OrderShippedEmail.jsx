
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
          <a href={this.props.tracking_link} style={{textDecoration:"none"}}>
            <div style={{margin:"10px 20px",display:"block",border:"1px solid #000",padding:"10px 20px",textAlign:"center",fontSize:"12px",width:"150px",margin:"20px auto",color:"#000"}}>
              LOVE TRACK, BABY!
            </div>
          </a>
          {/* this should work, but doesn't with our styles:
            <Items contents={this.props.contents}/>
            so let's just use an image instead
          */}
          <img src={`${this.props.order_link}?layout=image&token=${this.props.token}`} style={{width:"600px", margin:"20px auto"}}/>
        </td></tr>
      </tbody></table>
    );
  }
}


module.exports = OrderShippedEmail;
