
const React = require('react');
const Tabs = require('./Tabs.jsx');

/***
Draws controls for adding components to a product
***/
class ProductComponentPicker extends React.Component {
  constructor(props) {
    super(props);
  }

  handleTabClick() {
    let text_input = document.querySelector(".components").querySelector(`input[type="text"]`);
    if (text_input) {
      let value = text_input.value
      // cursor to the end
      text_input.focus();
      text_input.setSelectionRange(value.length, value.length);
      // update component letter type
      this.props.productCanvas.handleRemapComponentLetters(this.component_letter_map[this.tabs.state.selected_tab]);
    }
  }

  componentDidMount() {
    // init size of default selected tab
  }

  render() {
    let components = this.populateComponents(this.props.product);
    return (
      <div className="component_picker">
        <Tabs className="components"
          switch_below={true}
          ref={(element) => {this.tabs = element;}}
          onChange={this.handleTabClick.bind(this)}
        >
          {components}
        </Tabs>
      </div>
    );
  }

  handleAddComponent(component) {
    this.props.productCanvas.handleAddComponent(component);
  }
  handleSetComponentText(text, componentMap) {
    this.props.productCanvas.handleSetComponentText(text, componentMap);
  }
  handlePopComponent() {
    this.props.productCanvas.handlePopComponent();
  }
  handleSelectComponent(component) {
    this.props.productCanvas.handleSelectComponent(component);
  }
  populateComponents(product) {
    // populate components
    let components = [];
    let misc_components = [];
    this.component_letter_map = [];
    for (let i=0; product.compatible_components && i<product.compatible_components.length; i++) {
      let compatible_component = this.props.compatible_component_map[product.compatible_components[i]];
      if (compatible_component.options) {
        // handle if native keyboard
        if (compatible_component.props.is_letters) {
          // array => map
          let component_letters = {};
          for (let j=0; j<compatible_component.options.length; j++) {
            let letter = compatible_component.options[j];
            let toks = letter.sku.split('_');
            let character = toks[toks.length-1].toLowerCase();
            component_letters[character] = letter;
          }
          this.component_letter_map[i] = component_letters;
          components.push(
            <div key={components.length} name={compatible_component.props.name||compatible_component.sku} className="component_container letters">
              <div className="punnyInputWrap">
              <input type="text" className="clearInput" placeholder="Say Something" name={compatible_component.sku}
                onChange={(event) => {
                  this.handleSetComponentText(event.target.value, component_letters);
                }}
                onFocus={(event) => {
                  event.persist();
                  // TODO figure out some better scrolly what-nots?
                  setTimeout(() => {
                    event.target.scrollIntoView(false);
                  }, 1);
                }}
                onKeyUp={(event) => {
                  if (event.which!=13) return;
                  this.handleSetComponentText(event.target.value, component_letters);
                  this.props.productCanvas.handleSelectComponent(-1);
                }}
                value={this.props.productCanvas.getComponentText()}
              />
            </div>
            </div>
          );
          continue;
        } // is_native_keyboard

        // otherwise just list them
        let tab_components = [];
        for (let j=0; j<compatible_component.options.length; j++) {
          let backgroundImage = `url(${compatible_component.options[j].props.image})`;
          let backgroundSize = `${compatible_component.options[j].props.imagewidth/compatible_component.options[j].props.imageheight*100}% 100%`;
          if (compatible_component.options[j].props.imagewidth>compatible_component.options[j].props.imageheight)
            backgroundSize = `100% ${compatible_component.options[j].props.imageheight/compatible_component.options[j].props.imagewidth*100}%`;
          tab_components.push(
            <div key={i+'_'+j} style={{backgroundImage,backgroundSize}} onClick={() => {this.handleSelectComponent(-1); this.handleAddComponent(compatible_component.options[j]);}}/>
          );
        }
        components.push(
          <div key={components.length} name={compatible_component.props.name} className="rainbow_border">
            <div className="component_container">
            {tab_components}
          </div>
        </div>
        );
        continue;
      }
      misc_components.push(
        <div key={i+'_0'}  style={{backgroundImage:`url(${compatible_component.props.image})`}}/>
      );
    }

    if (misc_components.length) {
      components.push(
        <div key={components.length} name="misc sparkles" className="component_container">
          {misc_components}
        </div>
      );
    }
    return components;
  } // populateComponents()
}

module.exports = ProductComponentPicker;
