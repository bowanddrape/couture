
const React = require('react');

/***
called by PageEdit
***/
class PageEditHeroProduct extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.handleUpdate("store", {"model":"Store","query":{"id":"78f87a89-1bcb-4048-b6e5-68cf4ffcc53a"}});
  }

  handleUpdate(key, value) {
    if (!this.props.onChange) return;
    let update = this.props || {};
    update = JSON.parse(JSON.stringify(update));
    update[key] = value;
    this.props.onChange(update);
  }

  handleNewCard() {
    if (!this.props.onChange) return;
    let update = this.props || {};
    update = JSON.parse(JSON.stringify(update));
    update.options = update.options || [];
    update.options.push({});
    this.props.onChange(update);
  }

  handleRemoveCard(index) {
    if (!this.props.onChange) return;
    let update = this.props || {};
    update = JSON.parse(JSON.stringify(update));
    update.options = update.options || [];
    update.options.splice(index, 1);
    this.props.onChange(update);
  }

  handleUpdateOption(index, key, value) {
    if (!this.props.onChange) return;
    let update = this.props || {};
    update = JSON.parse(JSON.stringify(update));
    update.options[index][key] = value.trim();
    this.props.onChange(update);
  }

  handleUpdateFile(index, key, value) {
    let callFileHandlers = () => {
      if (index)
        this.handleUpdateItem(index, key, `https://s3.amazonaws.com/www.bowanddrape.com/page_uploads/${value.name}`);
      else
        this.handleUpdate(key, value);
      if (this.props.onFileUpload)
        this.props.onFileUpload(value);
    }

    if (!/\.mp4/.test(value.name)) {
      let image = new Image();
      image.src = window.URL.createObjectURL(value);
      return image.onload = () => {
        if (index)
          this.handleUpdateItem(index, `${key}_dims`, [image.naturalWidth, image.naturalHeight]);
        else
          this.handleUpdate(`${key}_dims`, [image.naturalWidth, image.naturalHeight]);
        callFileHandlers();
      };
    }
    callFileHandlers();
  }

  render() {
    let options = this.props.options || [];
    let option_cards = [];
    options.forEach((option, index) => {
      option_cards.push(<div key={option_cards.length} className="option">
        <div className="fields">
          <div><label>name</label><input type="text" onChange={(event)=>{this.handleUpdateOption(index, "name", event.target.value)}} value={option.name||""}/></div>
          <span style={{cursor:"pointer"}} className="remove" onClick={this.handleRemoveCard.bind(this, index)} title="delete">✘</span>
        </div>
      </div>);
    });
    let option_section = null;
    if (!this.props.customizer && this.props.base_sku) {
      option_section = (
        <div className="options">
          {option_cards}
          <div className="option" style={{cursor:"pointer"}} onClick={this.handleNewCard.bind(this)}>New Option</div>
        </div>
      )
    }

    return (
      <div className="edit_hero_product">
        <div>
          <label>image</label>
          <input type="file" onChange={(event)=>{
            this.handleUpdateFile(null, "image", event.target.files[0])
          }} placeholder={this.props.image||""} name="image"/>
          <input type="text" onChange={(event)=>{this.handleUpdate("image", event.target.value)}} value={this.props.image} placeholder=""/>
        </div>

        <div>
          <label>customizer link</label><input type="text" onChange={(event)=>{this.handleUpdate("customizer", event.target.value)}} value={this.props.customizer} placeholder=""/>
          <label>or ATS base sku</label><input type="text" onChange={(event)=>{this.handleUpdate("base_sku", event.target.value)}} value={this.props.base_sku} placeholder=""/>
        </div>
        <div><label>product name</label><input type="text" onChange={(event)=>{this.handleUpdate("name", event.target.value)}} value={this.props.name}/></div>
        <div><label>product price</label><input type="text" onChange={(event)=>{this.handleUpdate("price", event.target.value)}} value={this.props.price}/></div>
        <div><label>copy</label><textarea onChange={(event)=>{this.handleUpdate("copy", event.target.value)}} value={this.props.copy} /></div>
        {option_section}
      </div>
    );
  }
}

module.exports = PageEditHeroProduct;
