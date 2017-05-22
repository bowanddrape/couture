
const React = require('react');

class Stroke extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if (this.object) return;

    // create a new embedded svg, NEEDED for webkit as if you reuse an existing
    // element, as it will not fire the onload event
    this.object = document.createElement("object");
    let object = this.object;

    // apply inline styles
    for (let rule in (this.props.style||{})) {
      object.style[rule] = this.props.style[rule];
    }
    object.style.opacity = 0;
    this.refs.div.appendChild(object);

    // once the svg is loaded, set up our css
    object.onload = () => {
      // compute the longest path. Try to keep disconnected svg segments in
      // different paths (shft+ctrl+k in inkscape)
      let max_length = 0;
      object.contentDocument.querySelectorAll("path").forEach((path) => {
        max_length = Math.max(max_length, path.getTotalLength());
      });

      // the animated stroke works by setting a dash that is the length of the
      // longest path, then offsetting it so nothing is visible, then animating
      // it back to 0 offset
      let style = object.contentDocument.createElementNS("http://www.w3.org/2000/svg", "style");
      style.innerHTML = `
        path {
          stroke-dasharray: ${max_length} !important;
          stroke-dashoffset: -${max_length} !important;
        }
        svg.drawn path {
          stroke-dashoffset: 0 !important;
          transition: stroke-dashoffset ${this.props.duration||3}s cubic-bezier(0,.08,.04,.98);
        }
      `;

      // scaling svgs seems to be dumb, I guess I need to scale it myself?
      let svg = object.contentDocument.querySelector("svg");
      // find out how much we need to scale the svg by
      if (!this.scale) {
        let svg_width = svg.getAttribute("width");
        let svg_height = svg.getAttribute("height");
        this.scale = Math.min(object.offsetWidth/svg_width, object.offsetHeight/svg_height);
      }
      svg.querySelectorAll("path").forEach((path) => {
        path.setAttribute("transform", `scale(${this.scale})`);
      });
      svg.appendChild(style);
      // make it visible now that it's ready to rock
      object.style.opacity = 1;

      // apparently needs to wait for the styles we appended to apply
      setTimeout(()=>{
        object.contentDocument.querySelector("svg").classList.add("drawn");
      }, 10);
    }
    object.data = "/logo_stroke.svg";
  }

  setVisible() {
        object.contentDocument.querySelector("svg").classList.add("drawn");
  }

  render() {
    return (
      <div ref="div">
      </div>
    )
  }
}

module.exports = Stroke;
