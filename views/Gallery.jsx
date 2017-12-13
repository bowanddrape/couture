
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
      item.width = item.width || "90px";
      if (item.href) {
        // if link to this site, make it relative
        item.href = item.href.replace(/^https:\/\/couture\.bowanddrape\.com/, "");
        item.href = item.href.replace(/^https:\/\/www\.bowanddrape\.com/, "");
      }
      if (item.image) {
        item.image = item.image.replace(/^https:\/\/s3\.amazonaws\.com\/www.bowanddrape.com/, "https://s3.bowanddrape.com");
      }

      let media = (
        <img src={item.image} style={{width: "100%"}} />
      );
      if (/\.mp4/.test(item.image) || /\.webm/.test(item.image)) {
        media = (<video src={item.image} style={{width: "100%"}} autoPlay loop controls={false} muted playsInline />);
        if (item.has_audio)
          media = (<video src={item.image} style={{width: "100%"}} autoPlay loop controls={false}/>);
      }

      let style = {
        width: item.width,
        margin: `${border}`,
      };
      if (/px/.test(item.width)) {
        style.maxWidth = (parseInt(item.width)*4)+"px";
        if (item.image_dims) {
          style.minHeight = item.image_dims[1]/item.image_dims[0]*parseFloat(item.width);
        }
      }

      gallery_cards.push(
        <a key={gallery_cards.length} className={item.href?"card":"card not_link"} href={item.href||null} style={style} >
          {media}
          {item.caption ?
            <div className="caption" >
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
