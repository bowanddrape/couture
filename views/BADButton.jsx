
const React = require('react');

class BADButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      busy: false,
    }
  }

  componentDidMount() {
    if (!BowAndDrape) return;
    BowAndDrape.dispatcher.on('clear_busy', () => {
      this.setState({busy: false});
    });
  }

  handleClick(event) {
    if (this.state.busy) return;
    this.setState({busy: true});
    // if we're supposed to do something, do it!
    if (this.props.onClick) {
      event.persist();
      this.props.onClick(event);
    }
  }

  render() {
    let className = this.props.className;
    if (this.state.busy)
      className = className + " busyState";

    return (
      <button
        className = {className}
        id = {this.props.id}
        onClick = {(event) =>{
          this.handleClick(event);
        }}>
          {!this.state.busy?this.props.children:<img src="/loading.gif"/>}
      </button>
    );
  }
}

module.exports = BADButton;
