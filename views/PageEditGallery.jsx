
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
    if (typeof(value)=="string")
      value = value.trim();
    items[index][key] = value;
    this.props.onChange({items});
  }

  handleUpdateFile(index, key, value) {
    let callFileHandlers = () => {
      this.handleUpdateItem(index, key, `https://s3.amazonaws.com/www.bowanddrape.com/page_uploads/${value.name}`);
      if (this.props.onFileUpload)
        this.props.onFileUpload(value);
    }

    if (!/\.mp4/.test(value.name)) {
      let image = new Image();
      image.src = window.URL.createObjectURL(value);
      return image.onload = () => {
        this.handleUpdateItem(index, `${key}_dims`, [image.naturalWidth, image.naturalHeight]);
        callFileHandlers();
      };
    }
    callFileHandlers();
  }

  handleNewCard() {
    if (!this.props.onChange) return;
    let items = this.props.items;
    items = items || [];
    items.push({});
    this.props.onChange({items});
  }

  handleRemoveCard(index) {
    if (!this.props.onChange) return;
    let items = this.props.items || [];
    items = JSON.parse(JSON.stringify(items));
    items.splice(index, 1);
    this.props.onChange({items});
  }

  render() {
    let items = [];
    if (this.props.items) {
      this.props.items.forEach((item, index) => {
        let preview_image = item.image;
        if (preview_image)
          preview_image = preview_image.replace(/ /g, "%20");
        items.push(
          <card key={index} style={{display:"flex"}}>
            <div className="preview" style={{backgroundImage:`url(${preview_image})`}} />
            <fields>
              <div className="option_group">
                <label>image</label>
                <input type="file" onChange={(event)=>{
                  this.handleUpdateFile(index, "image", event.target.files[0])
                }} placeholder={item.image||""} name="image"/>
                <div className="checkbox">has_audio<input type="checkbox" onChange={(event)=>{this.handleUpdateItem(index, "has_audio", event.target.checked)}} checked={!!item.has_audio}/></div>
                <div><input type="text" name="image" onChange={(event)=>{this.handleUpdateItem(index, "image", event.target.value)}} value={item.image||""}/></div>
              </div>
              <div><label>href</label><input type="text" onChange={(event)=>{this.handleUpdateItem(index, "href", event.target.value)}} value={item.href||""}/></div>
              <div><label>width</label><input type="text" onChange={(event)=>{this.handleUpdateItem(index, "width", event.target.value)}} value={item.width||""} placeholder="90px"/></div>
              <div><label>caption</label><input type="text" onChange={(event)=>{this.handleUpdateItem(index, "caption", event.target.value)}} value={item.caption||""} /></div>
            </fields>
            <span style={{cursor:"pointer"}} className="remove" onClick={this.handleRemoveCard.bind(this, index)} title="delete">{'✘'}</span>
          </card>
        );
      });
    }

    return (
      <div className="edit_gallery">
        <div><label>border</label><input type="text" onChange={(event)=>{this.handleUpdate("border", event.target.value)}} value={this.props.border} placeholder="5px"/></div>
        <deck>
          {items}
        </deck>
        <card style={{cursor:"pointer"}} onClick={this.handleNewCard.bind(this)}>New Photo</card>
      </div>
    );
  }
}

module.exports = PageEditGallery;
