
const React = require('react');

/***
called by PageEdit
***/
class PageEditCarousel extends React.Component {

  constructor(props) {
    super(props);
  }

  handleUpdate(key, value) {
    if (!this.props.onChange) return;
    let update = this.props || {};
    update = JSON.parse(JSON.stringify(update));
    update[key] = value;
    this.props.onChange(update);
  }

  handleUpdateItem(index, key, value) {
    if (!this.props.onChange) return;
    let items = this.props.items;
    items[index][key] = value.trim();
    this.props.onChange({items});
  }

  handleNewCard() {
    if (!this.props.onChange) return;
    let items = this.props.items;
    items = items || [];
    items.push({});
    this.props.onChange({items});
  }

  render() {
    let items = [];
    if (this.props.items) {
      this.props.items.forEach((item, index) => {
        items.push(
          <card key={index} style={{display:"flex"}}>
            <div className="preview" style={{backgroundImage:`url(${item.image})`}} />
            <fields>
              <div><label>href</label><input type="text" onChange={(event)=>{this.handleUpdateItem(index, "href", event.target.value)}} value={item.href}/></div>
              <div><label>legend</label><input type="text" onChange={(event)=>{this.handleUpdateItem(index, "legend", event.target.value)}} value={item.legend}/></div>
            </fields>
          </card>
        );
      });
    }
    return (
      <div>
        <div><label>Border</label><input type="text" onChange={(event)=>{this.handleUpdate("border", event.target.value)}} value={this.props.border} placeholder="0px"/></div>
        <div><label>{"Slide Width (px)"}</label><input type="text" onChange={(event)=>{this.handleUpdate("width", event.target.value)}} value={this.props.width} placeholder="1440"/></div>
        <deck>
          {items}
        </deck>
        <card onClick={this.handleNewCard.bind(this)}>New Slide</card>
      </div>
    );
  }
}

module.exports = PageEditCarousel;
