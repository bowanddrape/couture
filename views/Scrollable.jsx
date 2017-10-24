
const React = require('react');

/***
An infinite scroll widget
props:
  component:{} // React component
  data:[] // whatever the content is to be rendered by the component
  component_props:{} // default props to be passed into all components drawn
  endpoint:"" // API endpoint
  page:{} // page object, as required by models/SQLTable.js
***/
class Scrollable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: this.props.data || []
    };
    this.detector;
    this.handleScroll = this.handleScroll.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    // if some fundamental prop changed, flush our data
    if (
      prevProps.component!=this.props.component ||
      prevProps.endpoint!=this.props.endpoint ||
      prevProps.component_props!=this.props.component_props
    ) {
      this.setState({data:[]});
    }
    this.handleScroll();
  }

  componentDidMount() {
    this.handleScroll();
    BowAndDrape.dispatcher.on("authenticated", this.handleScroll.bind(this));
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
      if (this.props.component_props)
        Object.assign(props, this.props.component_props);
      props.key = i;
      children.push(
        React.createElement(this.props.component, props)
      );
    }

    return (
      <div style={this.props.style}>
        {children}
        <div ref={(element) => {this.detector = element;}}></div>
        {/* TODO show loading state and error messages */}
      </div>
    );
  }

  handleScroll() {
    if (!BowAndDrape.token) return;
    let scrolled = (this.detector.getBoundingClientRect().top-20) < window.innerHeight;
    if (scrolled && !this.querying) {
      this.querying = true;
      let page = {};
      Object.assign(page, this.props.page);
      if (this.state.data.length)
        page.start = this.state.data[this.state.data.length-1][this.props.page.sort];
      BowAndDrape.api('GET', this.props.endpoint+(this.props.endpoint.indexOf('?')==-1?'?':'&')+"page="+JSON.stringify(page), null, (err, resp) => {
        this.querying = false;
        if (resp.length)
          this.setState({data: this.state.data.concat(resp)});
      });
    }
  }
}
module.exports = Scrollable;
