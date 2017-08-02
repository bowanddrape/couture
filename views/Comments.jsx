
const React = require('react');
const Timestamp = require('./Timestamp.jsx');

class Comments extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      new_comment: "",
    }
  }

  render() {
    let comments = [];
    this.props.comments.forEach((comment) => {
      comments.push(
        <comment key={comments.length}>
          <metadata>{comment.user.split('@')[0]} at <Timestamp time={comment.time}/></metadata>
          <message>{comment.msg}</message>
        </comment>
      );
    });

    return (
      <comments>
        {comments}
        <input type="text" placeholder="new comment" value={this.state.new_comment} onChange={(event)=>{
          this.setState({new_comment:event.target.value})
        }} onKeyUp={(event)=>{
          if(event.which==13) {
            this.props.handlePostComment(this.state.new_comment);
            this.setState({new_comment:""});
          }
        }}/>
      </comments>
    );
  }
}

module.exports = Comments;
