
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
      filter: "",
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
        <input type="text" placeholder="filter" style={{marginLeft:"10px"}} onChange={(event)=>{this.setState({filter:event.target.value});}} value={this.state.filter} />
      {this.state.filter?null:
      <PageEdit path="" elements={[]} whitelisted_components={this.props.whitelisted_components}/>
      }
      <Scrollable
        component={PageEdit}
        endpoint={this.state.filter?`/page?search=${this.state.filter}`:"/page"}
        component_props={{whitelisted_components:this.props.whitelisted_components}}
        page = {{sort:"path", direction:"ASC"}}
      />
      </div>
    )
  }
}

module.exports = PageList;
