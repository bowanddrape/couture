
const React = require('react');

/***
Display a bunch of images
***/
class Gallery extends React.Component {

  componentDidMount() {
  }

  render() {
    let items = this.props.items || [];
    let gallery_cards = [];

    let border = this.props.border || "0px";

    items.forEach((item) => {
      gallery_cards.push(
        <a key={gallery_cards.length} className={item.href?"card":"card not_link"} href={item.href||null} style={{
          width: item.width || "150px",
          border: `solid ${border} #fff`,
        }} >
          <img src={item.image} style={{
            width: item.width || "150px",
          }} />
          {item.caption ?
            <div className="caption" style={{border: `solid ${border} #fff`,borderTop: "none"}}>{item.caption}</div>
            : null
          }
        </a>
      );
    });

    return (
      <div className="gallery deck" style={{margin:"0 auto"}}
        ref={(element) => {this.element = element;}}
      >
        {gallery_cards}
      </div>
    )
  }
}

module.exports = Gallery;
