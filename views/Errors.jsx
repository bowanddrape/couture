
const React = require('react');

/***
Handle displaying error messages
call Errors.emitError
***/
class Errors extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      errors: this.props.errors || [],
    }
  }

  static emitError(label, message) {
    // if there is a listener for this specific label of error, fire that
    if(BowAndDrape.dispatcher.listenerCount(`error_${label}`))
      return BowAndDrape.dispatcher.emit(`error_${label}`, message);
    // otherwise fire generic error
    BowAndDrape.dispatcher.emit(`error_`, message);
  }

  static clear(label) {
    if (label)
      return BowAndDrape.dispatcher.emit(`error_${label}_clear`);
    return BowAndDrape.dispatcher.emit(`error_clear`);
  }

  componentDidMount() {
    // no listeners server side, obviously
    if (!BowAndDrape) return;
    let appendMessage = (message) => {
      this.setState((prevState) => {
        let errors = prevState.errors.slice(0);
        if (errors.indexOf(message)<0)
          errors.push(message);
        return ({errors: errors});
      });
    };
    let clearMessages = () => {
      this.setState({errors: []});
    }

    if (this.props.label) {
      BowAndDrape.dispatcher.on(`error_${this.props.label}`, appendMessage);
      BowAndDrape.dispatcher.on(`error_${this.props.label}_clear`, clearMessages);
    } else {
      BowAndDrape.dispatcher.on(`error_`, appendMessage);
    }
    BowAndDrape.dispatcher.on("error_clear", clearMessages);
  }

  render() {
    if (!this.state.errors.length)
      return null;
    let errors = [];
    this.state.errors.forEach((msg) => {
      errors.push(
        <div key={errors.length}>{msg}</div>
      );
    });
    return (
      <errors>{errors}</errors>
    );
  }
}

module.exports = Errors;
