
const React = require('react');
const Swipeable = require('react-swipeable');

class ProductCanvas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      assembly: this.props.assembly || [],
    }
  }

  componentDidMount() {
    this.canvas = document.querySelector("canvas");
    this.canvas.setAttribute("width", document.body.offsetWidth);
    this.customizer = new BowAndDrape.Customizer({canvas: this.canvas});
    this.customizer.init();
    this.forceUpdate();
  }

  handleAddComponent(component) {
    this.setState((prevState, props) => {
      let assembly = JSON.parse(JSON.stringify(prevState.assembly));
      // TODO have a selected component
      if (!assembly.length) {
        assembly.push({
          props: {
            position: component.props.position,
          },
          assembly: [component],
        });
        return {assembly};
      }
      let selected = assembly[0];
      selected.assembly.push(component);
      return {assembly};
    });
  }
  handlePopComponent() {
    this.setState((prevState, props) => {
      let assembly = JSON.parse(JSON.stringify(prevState.assembly));
      // TODO have a selected component
      if (!assembly.length) {
        return {};
      }
      let selected_index = 0;
      let selected = assembly[selected_index];
      selected.assembly.pop();
      if (!selected.assembly.length) {
        assembly.splice(selected_index, 1);
      }
      return {assembly};
    });
  }

  componentDidUpdate() {
    // handle actions on hitboxes
    let index = 0;
    this.canvas.parentNode.childNodes.forEach((node) => {
      if (node.tagName.toLowerCase()!="component_hitbox") return;
      node.ontouchmove = this.handleComponentMove.bind(this, index);
      node.onmousemove = this.handleComponentMove.bind(this, index);
      index++;
    });
  }


  handleComponentMove(index, event) {
    event.preventDefault();
    event.stopPropagation();

    if (event.touches && event.touches.length>1) return;
    if (event.type=="mousemove" && !event.buttons&0x1) return;
    let client_pos = event.touches ?
      [event.touches[0].pageX, event.touches[0].pageY] :
      [event.clientX, event.clientY+(document.body.scrollTop?document.body.scrollTop:document.documentElement.scrollTop)];

    this.customizer.components[index].position = this.customizer.browserToWorld(client_pos);

    this.forceUpdate();
  }
  componentWillUpdate(nextProps, nextState) {
    this.customizer.set(nextProps.product, nextState);
  }

  render() {
    let component_hitboxes = [];

    if (this.customizer) {
      this.customizer.components.forEach((component) => {
        let position_screen = this.customizer.worldToScreen(component.position);
        let dims_screen = this.customizer.getScreenDims(component);
        component_hitboxes.push(
          <component_hitbox
            key={component_hitboxes.length}
            style={{
              position:"absolute",
              left:`${position_screen[0]-dims_screen[0]/2}px`,
              top:`${position_screen[1]-dims_screen[1]/2}px`,
              width:`${dims_screen[0]}px`,
              height:`${dims_screen[1]}px`,
              backgroundColor:"rgba(0,0,0,0)",
              border:"solid 1px #000",
            }}
          />
        );
      });
    }

    return (
      <div style={{position:"relative"}}>
        <canvas height="300" style={{position:"relative"}}>
        </canvas>
        {component_hitboxes}
      </div>
    );
  }
}

module.exports = ProductCanvas;
