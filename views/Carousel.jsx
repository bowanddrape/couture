const React = require('react');

class ImageCarousel extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    let masonry = new Masonry(this.element, {
      itemSelector: ".card",
      columnWidth: 150,
      fitWidth: true,
      });
    } // componentDidMount

  render() {
    let items = this.props.items || [];
    let slides = [];
    items.forEach((item, index) => {
      let name = 'slide slide_${index}';
      slides.push(
        <div className={name} key={index}>
          <img src={item.href} alt={item.legend} />
        </div>
      );
    }); // items.forEach()

    return(
      <div className="carousel_container">
        <div style={{
          display: 'flex',
        }}>
          {slides}
        </div>
      </div>
    )
  } // render()
} // ImageCarousel

module.exports = ImageCarousel;
