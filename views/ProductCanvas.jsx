
const React = require('react');
const Swipeable = require('react-swipeable');

/***
Drawn by ProductList and contains the Customizer
Also manages hitboxes for Customizer Components
props:
  assembly:[] // list of components
  handleUpdateProduct:() // called when any update happens
***/
class ProductCanvas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      assembly: this.props.assembly || [],
      selected_component: -1,
    }
    this.handleUpdateProduct = props.handleUpdateProduct;
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
      let selected = assembly[prevState.selected_component];
      if (selected) {
        selected.assembly.push(component);
        return {assembly};
      }
      // if nothing is selected make a new selected component
      let position = [0,0,0];
      // facing the camera for now TODO get normal of intersected tri
      let rotation = {
        angle: -this.customizer.camera.rotation.angle,
        axis: this.customizer.camera.rotation.axis,
      }
      assembly.push({
        props: {
          position: position,
          rotation: rotation,
        },
        assembly: [component],
      });
      return {assembly, selected_component: assembly.length-1};
    });
  }
  handlePopComponent() {
    this.setState((prevState, props) => {
      let assembly = JSON.parse(JSON.stringify(prevState.assembly));
      let selected = assembly[prevState.selected_component];
      if (selected) {
        selected.assembly.pop();
        if (!selected.assembly.length) {
          assembly.splice(prevState.selected_component, 1);
          return {assembly, selected_component: -1};
        }
        return {assembly};
      }
      return {};
    });
  }

  componentDidUpdate(prevProps, prevState) {
    // handle actions on hitboxes
    this.canvas.parentNode.childNodes.forEach((node) => {
      if (node.tagName.toLowerCase()!="component_hitbox") return;
      // this overrides the synthetic react events so we don't scroll
      node.ontouchmove = this.handleComponentMove.bind(this, node.getAttribute("data"));
      node.onmousemove = this.handleComponentMove.bind(this, node.getAttribute("data"));
    });
    this.handleUpdateProduct();
  }


  handleComponentMove(index, event) {
    event.preventDefault();
    event.stopPropagation();

    if (event.touches && event.touches.length>1) return;
    if (event.type=="mousemove" && !event.buttons&0x1) return;
    let client_pos = event.touches ?
      [event.touches[0].pageX, event.touches[0].pageY] :
      [event.clientX, event.clientY+(document.body.scrollTop?document.body.scrollTop:document.documentElement.scrollTop)];

    // update the component position
    this.setState((prevState, props) => {
      let assembly = JSON.parse(JSON.stringify(prevState.assembly));
      let selected = assembly[index];
      if (selected) {
        selected.props.position = this.customizer.browserToWorld(client_pos);
      }
      return {assembly, selected_component: index};
    });

  }
  handleSelectComponent(index) {
    this.setState({selected_component: index});
  }
  componentWillUpdate(nextProps, nextState) {
    // send state to gl
    this.customizer.set(nextProps.product, nextState);
    // update our cameras
    this.cameras = nextProps.product.cameras;
    if (!this.cameras || typeof(this.cameras)!='array') {
      // the default camera, one meter away
      this.cameras = [];
      this.cameras.push({
        position: [0, 0, -1],
        rotation: {
          angle: 0,
          axis: [0, 1, 0],
        }
      });
      this.cameras.push({
        position: [0, 0, -1],
        rotation: {
          angle: Math.PI/4,
          axis: [0, 1, 0],
        }
      });
      this.cameras.push({
        position: [0, 0, -1],
        rotation: {
          angle: Math.PI,
          axis: [0, 1, 0],
        }
      });
    }
  }

  handleChangeCamera(index) {
    this.customizer.updatePMatrix(this.cameras[index]);
    this.handleSelectComponent(-1);
  }

  render() {
    let component_hitboxes = [];

    if (this.customizer) {
      for (let index=0; index<this.customizer.components.length; index++) {
        let component = this.customizer.components[index];
        let dims_screen = this.customizer.getScreenBoundingBox(component);
        // cull backfacing hitboxes
        if (dims_screen.bottom_right[0]<dims_screen.top_left[0]) continue;
        component_hitboxes.push(
          <component_hitbox
            key={component_hitboxes.length}
            style={{
              position:"absolute",
              left:`${dims_screen.top_left[0]}px`,
              top:`${dims_screen.bottom_right[1]}px`,
              width:`${dims_screen.bottom_right[0]-dims_screen.top_left[0]}px`,
              height:`${dims_screen.top_left[1]-dims_screen.bottom_right[1]}px`,
              backgroundColor:"rgba(0,0,0,0)",
              border:index==this.state.selected_component?`solid 1px #000`:`none`,
            }}
            data={index}
          />
        );
      };
    }

    let camera_switcher = [];
    if (this.cameras) {
      this.cameras.forEach((camera) => {
        camera_switcher.push(
          <button key={camera_switcher.length} onClick={this.handleChangeCamera.bind(this, camera_switcher.length)}>
            Camera {camera_switcher.length}
          </button>
        )
      });
    }

    return (
      <div style={{position:"relative"}}>
        <canvas height="300" style={{position:"relative"}}>
        </canvas>
        {component_hitboxes}
        <hud_controls style={{position:"absolute",right:"0",top:"0"}}>
          {camera_switcher}
        </hud_controls>
      </div>
    );
  }
}

module.exports = ProductCanvas;
