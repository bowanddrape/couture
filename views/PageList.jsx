
const React = require('react');
const Scrollable = require('./Scrollable.jsx');
const PageEdit = require('./PageEdit.jsx');

/***
Admin page for CMS pages
***/
class PageList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      errors: [],
    };
  }

  handleAddPage() {
    BowAndDrape.api("POST", "/page", {path:"",elements:[]}, (err, result) => {
      if (err) return setState({errors:[err.error]});
    });
  }

  render() {
    return (
      <div>
        Page List
        {this.state.errors.length?<errors>{this.state.errors}</errors>:null}
      <PageEdit path="" elements={[]} whitelisted_components={this.props.whitelisted_components}/>
      <Scrollable
        component={PageEdit}
        endpoint={"/page"}
        component_props={{whitelisted_components:this.props.whitelisted_components}}
        page = {{sort:"path", direction:"ASC"}}
      />
      </div>
    )
  }
}

module.exports = PageList;
