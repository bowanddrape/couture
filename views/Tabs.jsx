// TODO move this into it's own repo
const fs = require('fs');
const React = require('react');
const Switch = require('./Switch.jsx');

/***
This takes multiple children and lets you choose which one is visible
props:
  className:"" // does what you expect
children:
  <anytag name={displayed as tab}>{contents}</anytag>
***/
class Tabs extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selected_tab: 0,
    };
  }

  handleTabChange(value) {
    this.setState({selected_tab:value}, () =>{
      // fire an onChange on click as well as on change?
      if (typeof(this.props.onChange) == "function")
        this.props.onChange();
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      typeof(this.props.onChange) == "function" &&
      prevState.selected_tab != this.state.selected_tab
    ) {
      this.props.onChange();
    }
  }

  render() {
    let tabs = [];

    let children = React.Children.toArray(this.props.children);
    for (let index=0; index<children.length; index++) {
      let child = children[index];

      let grandchildren = React.Children.toArray(child.props.children);
      // try to figure out a name for this tab
      let tab_name_options = [child.props.name];
      if (grandchildren.length)
        tab_name_options.push(grandchildren[0].props.children);
      let tab_name = initDefaultFallback(...tab_name_options, "Tab");
      tabs.push(<option key={tabs.length} value={tabs.length}>{tab_name}</option>);
    };

    return (
      <tabs className={this.props.className}>
        {this.props.switch_below ? <tab_contents>{children[this.state.selected_tab]}</tab_contents> : null}
        <Switch always_expanded={true} value={this.state.selected_tab} onChange={this.handleTabChange.bind(this)}>
          {tabs}
        </Switch>
        {!this.props.switch_below ? <tab_contents>{children[this.state.selected_tab]}</tab_contents> : null}
      </tabs>
    );
  }
}

// returns the first non-null argument, useful for setting a default value
var initDefaultFallback = function() {
  for (let i=0; i<arguments.length; i++)
    if (arguments[i])
      return arguments[i];
  return null;
}


module.exports = Tabs;
