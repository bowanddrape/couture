
const React = require('react');

/***
Display a bunch of images
***/
class Gallery extends React.Component {

  componentDidMount() {
    let masonry = new Masonry(this.element, {
      itemSelector: ".card",
      columnWidth: 150,
      fitWidth: true,
    });
  }

  render() {
    let items = this.props.items || [];
    let gallery_cards = [];

    items.forEach((item) => {
      gallery_cards.push(
        <a key={gallery_cards.length} className={item.href?"card":"card not_link"} href={item.href||null} style={{
          margin: "0px",
          border: `solid ${this.props.border} #fff`,
          boxSizing: "border-box",
          width: item.width || "300px",
          height: item.height || "400px",
          backgroundImage: `url(${item.image})`,
          backgroundSize: "cover",
        }}>
          {item.caption ?
            <div className="caption">{item.caption}</div>
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
