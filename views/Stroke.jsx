
const React = require('react');

class Stroke extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    let object = document.createElement("object");

    for (let rule in this.props.style) {
      object.style[rule] = this.props.style[rule];
    }
    object.style.opacity = 0;
    this.refs.div.appendChild(object);

    object.onload = () => {
      let max_length = 0;
      object.contentDocument.querySelectorAll("path").forEach((path) => {
        max_length = Math.max(max_length, path.getTotalLength());
      });

      let style = object.contentDocument.createElementNS("http://www.w3.org/2000/svg", "style");
      style.innerHTML = `
        path {
          stroke-dasharray: ${max_length} !important;
          stroke-dashoffset: -${max_length} !important;
        }
        svg.drawn path {
          stroke-dashoffset: 0 !important;
          transition: stroke-dashoffset 3s cubic-bezier(0,.08,.04,.98);
        }
      `;

      let svg = object.contentDocument.querySelector("svg");
      if (!this.svg_width)
        this.svg_width = svg.getAttribute("width");
      //let svg_height = svg.getAttribute("height");
      //svg.removeAttribute("width");
      //svg.removeAttribute("height");
      let scale = object.offsetWidth/this.svg_width;
      svg.querySelectorAll("path").forEach((path) => {
        path.setAttribute("transform", `scale(${scale})`);
      });
      svg.appendChild(style);
      object.style.opacity = 1;

      // apparently needs to wait for the styles we appended to apply
      setTimeout(()=>{
        object.contentDocument.querySelector("svg").classList.add("drawn");
      }, 10);
    }
    object.data = "/logo_stroke.svg";
  }

  render() {
    return (
      <div ref="div">
      </div>
    )
  }
}

module.exports = Stroke;
