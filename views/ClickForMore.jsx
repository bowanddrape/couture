
const React = require('react');

/***
An widget that lets you click for more
props:
  href: string // content url
  blurb: string // optional blurb
  style: object // container style
  auto_desktop: bool // Auto expand when on desktop
***/
class ClickForMore extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      has_content: false,
      content: "",
      loaded: false,
    };
    this.detector;
    this.handleScroll = this.handleScroll.bind(this);
    this.handleLoad = this.handleLoad.bind(this);
  }

  handleScroll() {
  }

  handleLoad() {
    this.requestContent("GET", (err, resp) => {
      if (err) return;
      this.setState({content: resp.responseText});
    });
  }

  componentWillReceiveProps() {
    // reset state whenever props change
    this.setState({
      has_content: false,
      content: "",
      loaded: false,
    });
  }

  componentDidMount() {
    // check to see if we have a valid href
    this.requestContent("HEAD", (err, resp) => {
      if (err) return;
      this.setState({has_content: true});
    });
 
    if (this.props.auto_desktop)
      document.addEventListener('scroll', this.handleScroll);
  }

  componentDidUpdate(prevProps, prevState) {
    // if our props changed, we need to reset our content
    if (this.props.href != prevProps.href) {
      let self = this;
      this.requestContent("HEAD", (err, resp) => {
        if (err) return;
        this.setState({has_content: true});
      });
    }
  }

  requestContent(method, callback) {
   let xhr = new XMLHttpRequest();
    xhr.open(method, this.props.href, true);
    if (BowAndDrape.token)
      xhr.setRequestHeader("Authorization", "Bearer "+BowAndDrape.token);
    xhr.onreadystatechange = function() {
      if (this.readyState!=4) return;
      if (this.status!=200) return callback(this);
      callback(null, this);
    }
    xhr.send();
  }

  render() {
    if (!this.state.has_content) return null;

    return (
      <clickformore ref={(element) => {this.detector = element;}}>
        <div className="blurb">{this.props.blurb}</div>
        { this.state.content ?
          <div dangerouslySetInnerHTML={{__html:this.state.content}} /> :
          <div className="cta" style={{textAlign:"center",width:"60px",margin:"10px auto"}} onClick={this.handleLoad}>SEE MORE</div>
        }
      </clickformore>
    );
  }
}

module.exports = ClickForMore;
