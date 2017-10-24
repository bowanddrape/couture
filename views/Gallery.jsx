
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

    let border = this.props.border || "5px";

    items.forEach((item, index) => {
      gallery_cards.push(
        <a key={gallery_cards.length} className={item.href?"card":"card not_link"} href={item.href||null} style={{
          width: item.width || "125px",
          border: `solid ${border} #fff`,
        }} >
          <img src={item.image} style={{
            width: item.width || "125px",
          }} />
          {item.caption ?
            <div className="caption" style={{border: `solid ${border} #fff`,borderTop: "none"}}>
              {item.caption.split(" ").filter((tok)=>{return (tok[0]!='$')}).join(" ")}
              <span className="price">{item.caption.split(" ").filter((tok)=>{return (tok[0]=='$')}).join(" ")}</span>
            </div>
            : null
          }
        </a>
      );
      // force breaks after every 3 cards?
      if (index && !((index+1)%3)) {
        gallery_cards.push(
          <div key={gallery_cards.length} className="card linebreak"></div>
        )
      }
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
