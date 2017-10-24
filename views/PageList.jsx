
const React = require('react');
const Scrollable = require('./Scrollable.jsx');
const PageEdit = require('./PageEdit.jsx');
const Errors = require('./Errors.jsx');

class PageListElement extends React.Component {
  render() {
    return (
      <a href={"/page"+this.props.path} className="cta">
        {this.props.path}
      </a>
    )
  }
}

/***
Admin page for CMS pages
***/
class PageList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: "",
    };
  }

  handleAddPage() {
    BowAndDrape.api("POST", "/page", {path:"",elements:[]}, (err, result) => {
      if (err) return Errors.emitError(null, err.error);
    });
  }

  render() {
    return (
      <div>
        Page List
        <Errors />
        <input type="text" placeholder="filter" style={{marginLeft:"10px"}} onChange={(event)=>{this.setState({filter:event.target.value});}} value={this.state.filter} />
      {this.state.filter?null:
      <PageEdit path="" elements={[]} whitelisted_components={this.props.whitelisted_components}/>
      }
      <Scrollable
        component={PageListElement}
        endpoint={this.state.filter?`/page?search=${this.state.filter}`:"/page"}
        component_props={{whitelisted_components:this.props.whitelisted_components}}
        page = {{sort:"path", direction:"ASC"}}
        style={{display:"flex",flexDirection:"column"}}
      />
      </div>
    )
  }
}

module.exports = PageList;
