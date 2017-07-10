
const React = require('react');

/***
called by PageEdit
***/
class PageEditGallery extends React.Component {

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
            <img src={item.image} />
            <fields>
              <div><label>image</label><input type="text" onChange={(event)=>{this.handleUpdateItem(index, "image", event.target.value)}} value={item.image}/></div>
              <div><label>href</label><input type="text" onChange={(event)=>{this.handleUpdateItem(index, "href", event.target.value)}} value={item.href}/></div>
              <div><label>width</label><input type="text" onChange={(event)=>{this.handleUpdateItem(index, "width", event.target.value)}} value={item.width} placeholder="300px"/></div>
              <div><label>height</label><input type="text" onChange={(event)=>{this.handleUpdateItem(index, "height", event.target.value)}} value={item.height} placeholder="400px"/></div>
            </fields>
          </card>
        );
      });
    }

    return (
      <div>
        <div><label>border</label><input type="text" onChange={(event)=>{this.handleUpdate("border", event.target.value)}} value={this.props.border} placeholder="0px"/></div>
        <deck>
          {items}
        </deck>
        <card onClick={this.handleNewCard.bind(this)}>New Photo</card>
      </div>
    );
  }
}

module.exports = PageEditGallery;