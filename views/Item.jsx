
const React = require('react');

class Item extends React.Component {
  render() {
    let picklist = null;

    return (
      <item>
        {picklist}
        {JSON.stringify(this.props)}
      </item>
    )
  }
}

module.exports = Item;
