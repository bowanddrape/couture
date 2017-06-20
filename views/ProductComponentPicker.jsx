
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
    document.querySelector(".component_spacer").style.height = document.querySelector(".components").offsetHeight + "px";
    let text_input = document.querySelector(".components").querySelector(`input[type="text"]`);
    if (text_input)
      text_input.focus();
    // scroll so canvas is just below "add to cart" button
    document.querySelector("canvas").scrollIntoView();
    document.scrollY -= 20;
  }

  componentDidMount() {
    // init size of default selected tab
    document.querySelector(".component_spacer").style.height = document.querySelector(".components").offsetHeight + "px";
  }

  render() {
    let components = this.populateComponents(this.props.product);
    return (
      <div>
        <div className="component_spacer" />
        <Tabs className="components" onChange={this.handleTabClick.bind(this)}>
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
    for (let i=0; product.compatible_components && i<product.compatible_components.length; i++) {
      if (product.compatible_components[i].options) {
        // handle if virtual keyboard
        if (false && product.compatible_components[i].props.is_letters) {
          // array => map
          let component_letters = {};
          let tab_components = [];
          for (let j=0; j<product.compatible_components[i].options.length; j++) {
            let letter = product.compatible_components[i].options[j];
            let toks = letter.props.name.split('_');
            let character = toks[toks.length-1].toLowerCase();
            if (character.match(/^[a-z]$/))
              component_letters[character] = letter;
            else {
              component_letters[character] = letter;
              tab_components.push(
                <div key={i+'_'+j} style={{backgroundImage:`url(${letter.props.image})`,backgroundSize:`${letter.props.imagewidth/letter.props.imageheight*100}% 100%`}} onClick={this.handleAddComponent.bind(this, letter)}/>
              );
            }
          }
          components.push(
            <div key={components.length} name={product.compatible_components[i].props.name} className="component_virtual_keyboard_container">
              <row>{['q','w','e','r','t','y','u','i','o','p'].map((character)=>{
                return (<div key={character} style={{backgroundImage:`url(${component_letters[character].props.image})`,backgroundSize:`${component_letters[character].props.imagewidth/component_letters[character].props.imageheight*100}% 100%`}} onClick={this.handleAddComponent.bind(this, component_letters[character])}/>);
              })}</row>
              <row>
                <div key="spacer0" className="halfgap"/>
                {['a','s','d','f','g','h','j','k','l'].map((character)=>{
                  return (<div key={character} style={{backgroundImage:`url(${component_letters[character].props.image})`,backgroundSize:`${component_letters[character].props.imagewidth/component_letters[character].props.imageheight*100}% 100%`}} onClick={this.handleAddComponent.bind(this, component_letters[character])}/>);
                })}
                <div key="spacer1" className="halfgap"/>
              </row>
              <row>
                <div key="spacer2" className="halfgap"/>
                <div key="spacer2a" className="halfgap"/>
                {['z','x','c','v','b','n','m'].map((character)=>{
                  return (<div key={character} style={{backgroundImage:`url(${component_letters[character].props.image})`,backgroundSize:`${component_letters[character].props.imagewidth/component_letters[character].props.imageheight*100}% 100%`}} onClick={this.handleAddComponent.bind(this, component_letters[character])}/>);
                })}
                <div key="spacer3" className="halfgap"/>
                <div key="backspace" className="backspace" onClick={this.handlePopComponent.bind(this)}/>
              </row>
              <row>
                <div key="spacer3a" className="halfgap"/>
                <div key="spacer3b" className="halfgap"/>
                <div key="spacebar" className="spacebar" onClick={this.handleAddComponent.bind(this, component_letters["space"])}/>
                <div key="spacer3c" className="halfgap"/>
                <div key="enter" className="enter" onClick={this.handleSelectComponent.bind(this, -1)}/>
              </row>
            </div>
          );
          components.push(
            <div key={components.length} name={product.compatible_components[i].props.name+"_cont"} className="component_container">{tab_components}</div>
          );
          continue;
        } // is_letters

        // handle if native keyboard
        if (product.compatible_components[i].props.is_letters) {
          // array => map
          let component_letters = {};
          for (let j=0; j<product.compatible_components[i].options.length; j++) {
            let letter = product.compatible_components[i].options[j];
            let toks = letter.props.name.split('_');
            let character = toks[toks.length-1].toLowerCase();
            component_letters[character] = letter;
          }
          components.push(
            <div key={components.length} name={product.compatible_components[i].props.name} style={{height:"auto"}} className="component_container">
              <input type="text" style={{width:"90%"}} onChange={(event)=>{
                this.handleSetComponentText(event.target.value, component_letters);
                }}
                value={this.props.productCanvas.getComponentText()}
              />
            </div>
          );
          continue;
        } // is_native_keyboard

        // otherwise just list them
        let tab_components = [];
        for (let j=0; j<product.compatible_components[i].options.length; j++) {
          tab_components.push(
            <div key={i+'_'+j} style={{backgroundImage:`url(${product.compatible_components[i].options[j].props.image})`}} onClick={this.handleAddComponent.bind(this, product.compatible_components[i].options[j])}/>
          );
        }
        tab_components.push(
          <div key="backspace" className="backspace" onClick={this.handlePopComponent.bind(this)}/>
        );
        components.push(
          <div key={components.length} name={product.compatible_components[i].props.name} className="component_container">
            {tab_components}
          </div>
        );
        continue;
      }
      misc_components.push(
        <div key={i+'_0'}  style={{backgroundImage:`url(${product.compatible_components[i].props.image})`}}/>
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
