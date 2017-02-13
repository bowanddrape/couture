
const React = require('react');

class Scrollable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: this.props.data?this.props.data:[]
    };
    this.detector;
    this.handleScroll = this.handleScroll.bind(this);
  }

  componentDidMount() {
    this.handleScroll();
    document.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    document.removeEventListener('scroll', this.handleScroll);
  }

  render() {
    let children = [];
    for (let i=0; i<this.state.data.length; i++) {
      let props = {};
      Object.assign(props, this.state.data[i]);
      props.key = i;
      children.push(
        React.createElement(this.props.component, props)
      );
    }

    return (
      <div>
        {children}
        <div ref={(element) => {this.detector = element;}}></div>
      </div>
    );
  }

  handleScroll() {
    if (!BowAndDrape.token) return;
    let scrolled = (this.detector.getBoundingClientRect().top-20) < window.innerHeight;
    if (scrolled && !this.querying) {
      this.querying = true;
      var self = this;
      let xhr = new XMLHttpRequest();
      let page = {};
      Object.assign(page, this.props.page);
      if (this.state.data.length)
        page.start = this.state.data[this.state.data.length-1].requested;
      xhr.open("GET", this.props.endpoint+"&page="+JSON.stringify(page), true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Authorization", "Bearer "+BowAndDrape.token);
      xhr.onreadystatechange = function() {
        if (this.readyState!=4) { return; }
        self.querying = false;
        self.setState({data: self.state.data.concat(JSON.parse(this.responseText))});
      }
      xhr.send();
    }
  }
}
module.exports = Scrollable;