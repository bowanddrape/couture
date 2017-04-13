
const React = require('react');
const Swipeable = require('react-swipeable');

class ProductCanvas extends React.Component {
  constructor(props) {
    super(props);
    this.onSwipe = this.onSwipe.bind(this);

  }

  componentDidMount() {
    this.canvas = document.querySelector("canvas");
    this.canvas.setAttribute("width", document.body.offsetWidth);
    this.customizer = new BowAndDrape.Customizer({canvas: this.canvas});
    this.customizer.init();
    this.forceUpdate();
  }

  handleComponentMove(event) {
        event.preventDefault();
        event.stopPropagation();

        if (event.touches && event.touches.length>1) return;
        if (event.type=="mousemove" && !event.buttons&0x1) return;
        let client_pos = event.touches ?
          [event.touches[0].pageX, event.touches[0].pageY] :
          [event.clientX, event.clientY+(document.body.scrollTop?document.body.scrollTop:document.documentElement.scrollTop)];
        
        this.customizer.cursor.position = this.customizer.browserToWorld(client_pos);
        this.forceUpdate();
  }
  componentDidUpdate() {
    // handle actions on hitboxes
    this.canvas.parentNode.childNodes.forEach((node) => {
      if (node.tagName.toLowerCase()!="component_hitbox") return;
      node.ontouchmove = this.handleComponentMove.bind(this);
      node.onmousemove = this.handleComponentMove.bind(this);
    });
  }

  onSwipe(event, deltaX, deltaY, absX, absY, velocity) {
    event.stopPropagation();
  }

  render() {
    let component_hitboxes = [];

    let cursor_position_screen = this.customizer?this.customizer.worldToScreen(this.customizer.cursor.position):[0,-100];
    let cursor_dims_screen = [100, 100];
    if (this.canvas) {
      component_hitboxes.push(
        <component_hitbox
          style={{
            position:"absolute",
            left:`${cursor_position_screen[0]-cursor_dims_screen[0]/2}px`,
            top:`${cursor_position_screen[1]-cursor_dims_screen[1]/2}px`,
            width:`${cursor_dims_screen[0]}px`,
            height:`${cursor_dims_screen[1]}px`,
            backgroundColor:"rgba(0,0,0,0)",
            border:"solid 1px #000",
          }}
        />
      )
    }

    return (
      <div style={{position:"relative"}}>
        <canvas height="300" style={{backgroundImage:`url(${this.props.product.props.image})`,position:"relative"}}>
        </canvas>
        {component_hitboxes}
      </div>
    );
  }
}

module.exports = ProductCanvas;
