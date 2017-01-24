
const fs = require('fs');
const React = require('react');

const colors = {
  'color_secondary': '#000',
  'color_support_0': '#eaeaea',
  'color_support_1': '#f5c9ca',
  'color_support_3': '#7f5cff',
};

let styles = {
  tab_select: {
    display: 'flex',
  },
  tab: {
    padding: '15px',
    margin: '0 15px',
    flexGrow: '1',
    flexShrink: '1',
    opacity: '0.8',
    border: '2px solid '+colors['color_secondary'],
    borderBottom: 'none',
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
  },
  tab_selected: {
    padding: '15px',
    margin: '0 15px',
    flexGrow: '1',
    flexShrink: '1',
    backgroundColor: colors['color_support_0'],
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
  },
}

var initDefaultFallback = function() {
  for (let i=0; i<arguments.length; i++)
    if (arguments[i])
      return arguments[i];
  return null;
}

class Tabs extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selected_tab: 0,
    };
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
      tabs.push(<div key={tabs.length} onClick={()=>{this.setState({selected_tab:index})}} style={this.state.selected_tab==index?styles.tab_selected:styles.tab}>{tab_name}</div>);
    };

    return (
      <tabs>
        <tab_select style={styles.tab_select}>{tabs}</tab_select>
        <tab_contents>
          {children[this.state.selected_tab]}
        </tab_contents>
      </tabs>
    );
  }

}


module.exports = Tabs;

