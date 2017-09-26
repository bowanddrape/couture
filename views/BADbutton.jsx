
const React = require('react');

class BADbutton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      busy: false,
      buttonText: this.props.text,
      className: this.props.className,
    }
  }

  componentDidMount() {
    if (!BowAndDrape) return;
    BowAndDrape.dispatcher.on('clear_busy', () => {
      this.setState({
        busy: false,
        className: this.props.className
      });
    });
  }

  handleClick() {
    if (this.state.busy) return;
    this.setState({
      busy: true,
      className: this.props.className + " busyState"});
    }

  render() {
    return (
      <button
        className = {this.state.className}
        id = {this.props.id}
        onClick = {(event) =>{
          this.handleClick();
          event.persist();
          this.props.onClick(event);
        }}>
          {this.state.buttonText}
      </button>
    );
  }
}

module.exports = BADbutton;
