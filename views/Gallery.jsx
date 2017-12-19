
const React = require('react');

/***
Display a bunch of images
***/
class Gallery extends React.Component {

  constructor(_props) {
    let props = Object.assign({}, {items:[]}, _props);
    super(props);
    this.state = {
      items_loaded: 0,
      load_delay_timeout: false,
    }
    this.handleItemLoad = this.handleItemLoad.bind(this);
  }

  handleItemLoad() {
    this.setState((prev_state) => {
      return {items_loaded:prev_state.items_loaded+1}
    });
  }

  componentDidMount() {
    setTimeout(() => {
if (this.state.items_loaded<this.props.items.length)
      this.setState({load_delay_timeout:true});
    }, 2000);
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
        <img onLoad={this.handleItemLoad} src={item.image} style={{width: "100%"}} />
      );
      if (/\.mp4/.test(item.image) || /\.webm/.test(item.image)) {
        media = (<video onLoad={this.handleItemLoad} src={item.image} style={{width: "100%"}} autoPlay loop controls={false} muted playsInline />);
        if (item.has_audio)
          media = (<video onLoad={this.handleItemLoad} src={item.image} style={{width: "100%"}} autoPlay loop controls={false}/>);
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

    // display loading state
    if (this.props.items && this.state.items_loaded<this.props.items.length && !this.state.load_delay_timeout) {
      let loading_items = [];
      items.forEach((item, index) => {
        let width = this.props.items.length > 1? 30 : 100;
        let style = {
          width: `${width}%`,
          margin: `${border}`,
        };
        if (item.image_dims) {
          style.height = (item.image_dims[1]/item.image_dims[0]*width)+"vw";
        }
        loading_items.push(
          <div className="card" style={style} key={index}><div className="loading_spinner"/></div>
        )
      });
      return (
        <div className="gallery deck" style={{margin:"0 auto"}}>
          <div style={{display:"none"}}>{gallery_cards}</div>
          {loading_items}
        </div>
      );
    }

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
