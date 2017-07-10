
const React = require('react');

/***
called by PageEdit
***/
class PageEditTextContent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      content_string: this.props.content_string,
    }
  }

  handleUpdate(content_string) {
    if (!this.props.onChange) return;
    let update = this.props || {};
    update = JSON.parse(JSON.stringify(update));
    update.content_string = content_string;
    this.props.onChange(update);
  }

  render() {
    return (
      <textarea style={{
        width: "100%",
        height: "200px",
      }} onChange={(event)=>{this.handleUpdate(event.target.value)}} value={this.props.content_string}/>
    )
  }
}
module.exports = PageEditTextContent;
