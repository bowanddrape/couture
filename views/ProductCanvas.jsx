
const React = require('react');
const SylvestorGlUtils = require('sylvester-es6');
const Matrix = SylvestorGlUtils.Matrix;
const Vector = SylvestorGlUtils.Vector;
const ProductComponentPicker = require('./ProductComponentPicker.jsx');

// lookup table to find skus corresponding to certain characters
let character_to_skutext = {
  "_":"underscore",
};
let skutext_to_character = {};
Object.keys(character_to_skutext).forEach((key) => {
  skutext_to_character[character_to_skutext[key]] = [key];
});

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
    BowAndDrape.dispatcher.on("resize", () => {
      this.customizer.resizeViewport();
      this.setState({bodyWidth: document.body.offsetWidth});
    });
  }

  // get a text version of a component
  getComponentText() {
    let ret = "";
    let selected = this.state.assembly[this.state.selected_component];
    if (!selected) return ret;
    selected.assembly.forEach((component) => {
      let toks = component.sku.split('_');
      let character = toks[toks.length-1].toLowerCase();
      character = skutext_to_character[character] || character;
      ret += character;
    });
    return ret;
  }
  // set a component with a string and componentMap
  handleSetComponentText(text, componentMap) {
    this.setState((prevState, props) => {
      let assembly = JSON.parse(JSON.stringify(prevState.assembly));
      let selected_component = prevState.selected_component;
      let selected = assembly[prevState.selected_component];
      if (!selected) {
        // if nothing is selected make a new selected component
        let position = [0, 0, 0];
        // if we have other stuff, make a new line below
        if (assembly.length) {
          // FIXME this assumes same side and a bunch of wrong shit
          let prev_line = assembly[assembly.length-1];
          position[0] = prev_line.props.position[0];
          position[1] = prev_line.props.position[1];
          position[2] = prev_line.props.position[2];
          if (prev_line.assembly.length && prev_line.assembly[prev_line.assembly.length-1].props) {
            position[1] -= parseFloat(prev_line.assembly[prev_line.assembly.length-1].props.imageheight);
          }
        }
        // facing the camera for now TODO get normal of intersected tri
        let rotation = Matrix.I(4);
        if (this.customizer.camera.rotation.angle) {
          rotation = Matrix.Rotation(
            -this.customizer.camera.rotation.angle,
            new Vector(this.customizer.camera.rotation.axis)
          ).ensure4x4();
        }
        selected = {
          props: {
            position,
            rotation,
          },
          assembly: [],
        };
        assembly.push(selected);
        selected_component = assembly.length-1;
      }
      if (!text || !text.trim()) {
        assembly.splice(selected_component, 1);
        return {assembly, selected_component: -1};
      }
      selected.assembly = text.split("").map((letter) => {
        letter = letter.toLowerCase();
        letter = character_to_skutext[letter] || letter;
        // deep copy and set the quantity of this component to be used to 1
        let component = undefined;
        try {
          component = JSON.parse(JSON.stringify(componentMap[letter]));
          component.quantity = 1;
        } catch (err) {}
        return component;
      }).filter((component) => {
        return component;
      });
      return {assembly, selected_component};
    });
  }

  handleAddComponent(component) {
    // deep copy and set the quantity of this component to be used to 1
    component = JSON.parse(JSON.stringify(component));
    component.quantity = 1;
    this.setState((prevState, props) => {
      let assembly = JSON.parse(JSON.stringify(prevState.assembly));
      let selected = assembly[prevState.selected_component];
      if (selected) {
        selected.assembly.push(component);
        return {assembly};
      }
      // if nothing is selected make a new selected component
      // facing the camera for now TODO get normal of intersected tri
      let position = [0,0,0];
      let rotation = Matrix.I(4);
      if (this.customizer.camera.rotation.angle) {
        rotation = Matrix.Rotation(
          -this.customizer.camera.rotation.angle,
          new Vector(this.customizer.camera.rotation.axis)
        ).ensure4x4();
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

  handlePopComponent(cascade=false) {
    this.setState((prevState, props) => {
      let assembly = JSON.parse(JSON.stringify(prevState.assembly));
      let selected = assembly[prevState.selected_component];
      if (selected) {
        selected.assembly.pop();
        if (cascade || !selected.assembly.length) {
          assembly.splice(prevState.selected_component, 1);
          return {assembly, selected_component: -1};
        }
        return {assembly};
      }
      return {};
    });
  }

  handleDelComponent(cascade=false) {
    this.setState((prevState, props) => {
      let assembly = JSON.parse(JSON.stringify(prevState.assembly));
      let selected = assembly[prevState.selected_component];
      if (selected) {
        selected.assembly.pop();
        if (cascade || !selected.assembly.length) {
          assembly.splice(prevState.selected_component, 1);
          return {assembly, selected_component: -1};
        }
        return {assembly};
      }
      return {};
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

  handleComponentRotate(angle, event) {
    // update the component rotation
    this.setState((prevState, props) => {
      let assembly = JSON.parse(JSON.stringify(prevState.assembly));
      let selected = assembly[prevState.selected_component];
      if (selected) {
        let component_rotation = new Matrix(selected.props.rotation.elements);
        let camera_rotation = Matrix.Rotation(this.customizer.camera.rotation.angle, new Vector(this.customizer.camera.rotation.axis));
        selected.props.rotation = Matrix.Rotation(angle, camera_rotation.x(new Vector(this.customizer.camera.position))).ensure4x4().x(component_rotation);
      }
      return {assembly};
    });
  }

  handleComponentCenter(index) {
    // update the component rotation
    this.setState((prevState, props) => {
      let assembly = JSON.parse(JSON.stringify(prevState.assembly));
      let selected = assembly[prevState.selected_component];
      if (selected) {
        let position = [0,0,0];
        let rotation = Matrix.I(4);
        if (this.customizer.camera.rotation.angle) {
          rotation = Matrix.Rotation(
            -this.customizer.camera.rotation.angle,
            new Vector(this.customizer.camera.rotation.axis)
          ).ensure4x4();
        }
        selected.props.rotation = rotation;
        selected.props.position = position;
      }
      return {assembly};
    });
  }

  handleSelectComponent(index) {
    this.setState({selected_component: index});
  }

  handleChangeCamera(index) {
    this.camera_index = index;
    this.customizer.updatePMatrix(this.cameras[this.camera_index]);
    this.handleSelectComponent(-1);
  }

  autoLayout(reflow=false) {
    let getComponentsOfInterest = (assembly) => {
      return assembly.filter((component) => {
        let camera_position_world = Matrix.Rotation(this.customizer.camera.rotation.angle, new Vector(this.customizer.camera.rotation.axis)).ensure4x4().x(new Vector([this.customizer.camera.position[0],this.customizer.camera.position[1],this.customizer.camera.position[2],1]));
        let component_rotation = new Matrix(component.props.rotation.elements);
        let relative_camera_direction = component_rotation.x(camera_position_world).elements;
        return relative_camera_direction[2] <= 0;
        // TODO don't affect components that have been positioned manually
        // unless the reflow flag is flipped?
      });
    }

    this.setState((prevState, prevProps) => {
      let assembly = JSON.parse(JSON.stringify(prevState.assembly));
      let selected_component = prevState.selected_component;
      // TODO rectangular design areas for now
      let design_area = this.props.product.props.design_area&&this.props.product.props.design_area.width ? this.props.product.props.design_area : {
        top: this.props.product.props.imageheight/2 - (this.props.product.props.imageheight * 0.2),
        left: -this.props.product.props.imagewidth/2,
        width: this.props.product.props.imagewidth*5/9,
        height: this.props.product.props.imageheight*3/4,
        gravity: [0,this.props.product.props.imageheight/4],
      };
      // only work on visible components
      let components = getComponentsOfInterest(assembly);

      // TODO reorder component map to match current positions

      // TODO go through and break up phrases that are too long
      if (reflow) {
        components.forEach((component, index) => {
          let total_width = 0;
          component.assembly.forEach((assembly_component) => {
            if (assembly_component.props)
              total_width += parseFloat(assembly_component.props.imagewidth);
          });
          if (total_width<=design_area.width) return;
          // try to find a breakpoint
          for (let i=0; i<component.assembly.length-1; i++) {
            let assembly_component_toks = component.assembly[i].sku.split('_');
            let is_space = assembly_component_toks[assembly_component_toks.length-1]=="space";

            if (
              is_space ||
              (i>0 && assembly_component_toks[0]!=component.assembly[i-1].sku.split('_')[0])
            ) {
              // add a new component line with what we cut off
              let new_assembly = is_space ? component.assembly.slice(i+1) : component.assembly.slice(i);
              assembly.splice(assembly.indexOf(component)+1, 0, {
                assembly: new_assembly,
                props: JSON.parse(JSON.stringify(component.props)),
              });
              // remove the rest of this line
              component.assembly = component.assembly.slice(0,i);
              selected_component += 1;
            }
          }
        });
        // update the array of components we're working on
        components = getComponentsOfInterest(assembly);
      } // break up long phrases

      let line_count = 0;
      let total_height = 0;
      // get total height
      components.forEach((component) => {
        line_count += 1;
        component.max_height = 0;
        component.assembly.forEach((assembly_component) => {
          if (assembly_component.props)
            component.max_height = Math.max(component.max_height, assembly_component.props.imageheight);
        });
        total_height += component.max_height;
      });
      if (!line_count) return {};
      // line spacing is as large as possible between 0 and mean_lineheight/2
      let line_spacing = Math.max(Math.min((design_area.height-total_height)/(line_count-1), total_height/line_count/2), 0);
      let line_position = Math.min(design_area.top, design_area.gravity[1] + (total_height+line_spacing*(line_count-1))/2);
      components.forEach((component, index) => {
        component.props.position = component.props.position || [0,0,0];
        // center
        component.props.position[0] = 0;
        component.props.position[1] = line_position - component.max_height/2;
        line_position -= component.max_height + line_spacing;
      });
      return {assembly, selected_component};
    });
  }

  componentDidUpdate(prevProps, prevState) {
    this.customizer.resizeViewport();
    // handle actions on hitboxes
    this.canvas.parentNode.childNodes.forEach((node) => {
      if (node.tagName.toLowerCase()!="component_hitbox") return;
      // this overrides the synthetic react events so we don't scroll
      node.ontouchmove = this.handleComponentMove.bind(this, node.getAttribute("data"));
      node.onmousemove = this.handleComponentMove.bind(this, node.getAttribute("data"));
      node.onclick = this.handleSelectComponent.bind(this, node.getAttribute("data"));
    });
    this.handleUpdateProduct();
  }

  componentWillUpdate(nextProps, nextState) {
    // send state to gl
    this.customizer.set(nextProps.product, nextState);
    // update our cameras
    this.cameras = nextProps.product.props.cameras;
    if (!this.cameras || (typeof(this.cameras)!='array'&&typeof(this.cameras)!='object')) {
      // the default camera, one meter away
      this.cameras = [];
      this.cameras.push({
        position: [0, 0, -1],
        rotation: {
          angle: 0,
          axis: [0, 1, 0],
        }
      });
    }
    if (!this.camera_index || this.camera_index+1>this.cameras.length)
      this.camera_index = 0;
    this.customizer.updatePMatrix(this.cameras[this.camera_index]);
  }

  render() {
    let component_hitboxes = [];

    if (this.customizer) {
      for (let index=0; index<this.customizer.components.length; index++) {
        let component = this.customizer.components[index];
        let dims_screen = this.customizer.getScreenBoundingBox(component);
        // FIXME we want to cull backfacing hitboxes but not like this
        //if (dims_screen.bottom_right[0]<dims_screen.top_left[0]) continue;
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

    let hud_controls = [];
    if (this.state.assembly[this.state.selected_component]) {
      hud_controls.push(<button className="hudBtn hudBtn--delete" key={hud_controls.length} onClick={this.handlePopComponent.bind(this, true)}>Delete</button>);
      hud_controls.push(<div key={hud_controls.length}><button className="hudBtn hudBtn--rotateLeft" onClick={this.handleComponentRotate.bind(this, -Math.PI/20)}>Rotate</button>
    <button className="hudBtn hudBtn--rotateRight" onClick={this.handleComponentRotate.bind(this, Math.PI/20)}>Rotate</button></div>
      );
      hud_controls.push(<button className="hudBtn hudBtn--center" key={hud_controls.length} onClick={this.handleComponentCenter.bind(this)}>Center</button>);
      hud_controls.push(<button className="hudBtn hudBtn--done" key={hud_controls.length} onClick={this.handleSelectComponent.bind(this, -1)}>Done</button>);
    }
    else if (this.cameras && this.cameras.length>1) {
      this.cameras.forEach((camera) => {
        let camera_label = camera.name|| `Camera ${hud_controls.length}`;
        let camera_class = camera_label + 'view cameraBtn';
        hud_controls.push(
          <button className={camera_class}  key={hud_controls.length} onClick={this.handleChangeCamera.bind(this, hud_controls.length)}>
            {camera_label} View
          </button>
        );
      });
      hud_controls.push(<button key={hud_controls.length} className="cameraBtn centerBtn" onClick={this.autoLayout.bind(this, true)}>Center All</button>);
    }

    return (
      <div className={this.state.assembly[this.state.selected_component]?"component_selected component_wrapper":"component_wrapper"}>
        <canvas>
        </canvas>
        {component_hitboxes}
        <hud_controls className={this.state.assembly[this.state.selected_component]?"rainbow_border":""}>{hud_controls}</hud_controls>
        <ProductComponentPicker product={this.props.product} productCanvas={this} compatible_component_map={this.props.compatible_component_map}/>
      </div>
    );
  }
}

module.exports = ProductCanvas;
