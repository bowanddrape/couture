
const React = require('react');
const ItemUtils = require('./ItemUtils.js');
const Price = require('./Price.jsx');

/* I moved the styles to inline for email compatibility, but currently the item
design is still relying on unsupported styles and thus doesn't work */
const style = {};
const style_summary = {
  item: {
    clear: "both",
  }
}
/***
Draw an Item. Used in views/Items.jsx
props: will mirror a Component model
***/
class Item extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      props: this.props,
      new_tag: "",
      current_tags: this.props.tags,
    };
    this.handleAddTag = this.handleAddTag.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    this.setState({
      new_tag: value
    });
  }

  handleTagging(add_tags, remove_tags){
    let payload = {
      id: this.props.shipment_id,
      content_index: this.props.content_index,
      add_tags,
      remove_tags,
    }

    BowAndDrape.api("POST", "/shipment/tagcontent", payload, (err, results) => {
      if (err) {
        console.log(err);
        return Errors.emitError(err);
      }
      // now that we removed the tag, also redraw the tag section on this view
      this.setState((prev_state) => {
        let current_tags = prev_state.current_tags.slice();
        current_tags = current_tags.filter((prev_tag) => {
          if (remove_tags.indexOf(prev_tag) != -1){
            return false;
          }
          return true;
        });
        let new_tags = current_tags.concat(add_tags);
        return {current_tags: new_tags};
      });
    }); //BowAndDrape.api
  }

  handleRemoveTag(tag) {
    // TODO also log metrics
    let remove_tags = [tag];
    let payload = {
      id: this.props.shipment_id,
      content_index: this.props.content_index,
      remove_tags,
    }

    BowAndDrape.api("POST", "/shipment/tagcontent", payload, (err, results) => {
      if (err) {
        console.log(err);
        return Errors.emitError(err);
      }
      // now that we removed the tag, also redraw the tag section on this view
      this.setState((prev_state) => {
        let current_tags = prev_state.current_tags.slice();
        current_tags = current_tags.filter((prev_tag) => {
          return prev_tag != tag;
        });
        return {current_tags};
      });
    });
  }

  handleAddTag() {
    // ignore if we don't have a new tag to add
    if (!this.state.new_tag.trim()) return;
    // TODO also log metrics
    let add_tags = [this.state.new_tag];
    let payload = {
      id: this.props.shipment_id,
      content_index: this.props.content_index,
      add_tags,
    }
    BowAndDrape.api("POST", "/shipment/tagcontent", payload, (err, results) =>  {
      if (err) {
        console.log(err);
        return Errors.emitError(err);
      }
      // add tag to existing current_tags
      let newTags = add_tags.concat(this.state.current_tags);
      this.setState({
        current_tags: newTags,
        new_tag: "",
      });
    });
  }

  render() {
    if (!this.props.props) {
      return (
        <div className="item">{JSON.stringify(this.props)}</div>
      );
    }
    let className = "item";
    if (new RegExp("^promo:", "i").test(this.props.props.name) && this.props.onRemove)
      className += " promo";
    if (this.props.fulfillment) {
      className += " fulfillment";
    }

    let quantity = this.props.quantity || 1;

    let info = [];
    if (this.props.props && this.props.props.info) {
      info.push(
        <div key={info.length}>{this.props.props.info}</div>
      )
    }
    for (let i=1; typeof(this.props.props.options)!="undefined" && i<this.props.props.options.length; i++) {
      info.push(
        <div key={info.length}>{this.props.props.options[i]}</div>
      )
    }

    let assembly_phrase = [];
    let assembly = [];
    let assembly_contents = {};
    if (this.props.fulfillment && this.props.assembly) {
      for (let i=0; i<this.props.assembly.length; i++) {
        ItemUtils.recurseAssembly(this.props.assembly[i], (component) => {
          let sku = component.sku || component.props.name;

          // ignore anything you can't see
          if (!component.props || !component.props.image) return;
          let last_sku_tok = sku.split("_").pop();
          // only add single-letters
          if (last_sku_tok.length==1) {
            let style = {fontWeight:"bold"};
            if (/embroidery/.test(sku))
              style = {fontStyle:"italic"};
            assembly_phrase.push(<span key={assembly_phrase.length} style={style}>{last_sku_tok}</span>);
          }
          // skip skus corresponding to spaces
          if (last_sku_tok == " ") return;

          component.quantity = component.quantity || 1;
          if (!assembly_contents[sku])
            assembly_contents[sku] = JSON.parse(JSON.stringify(component));
          else
            assembly_contents[sku].quantity += component.quantity;
        }); // recurseAssembly
        assembly_phrase.push(<span key={assembly_phrase.length}> </span>);
      } // this.props.assembly.forEach
      Object.keys(assembly_contents).sort().forEach((sku) => {
        let label = assembly_contents[sku].props.name || sku;
        let image_width = 20;
        let image_height = 20;
        if (assembly_contents[sku].props.imagewidth<assembly_contents[sku].props.imageheight) {
          image_width *= assembly_contents[sku].props.imagewidth/assembly_contents[sku].props.imageheight;
        }
        if (assembly_contents[sku].props.imagewidth>assembly_contents[sku].props.imageheight) {
          image_height *= assembly_contents[sku].props.imageheight/assembly_contents[sku].props.imagewidth;
        }
        assembly.push(
          <span key={assembly.length} style={{marginRight:"8px"}}>
            <span className="assembly_image">
              <img src={assembly_contents[sku].props.image} style={{width:image_width, height:image_height}} />
            </span>
            {assembly_contents[sku].quantity>1?<span className="quant">{"x"+assembly_contents[sku].quantity}</span>:null}
            <span className="label">{label}</span>
          </span>
        );
      });
      if (assembly.length)
        assembly = (<div className="assembly">{assembly}</div>);
    }

    let tag_list = null;
    if (this.props.fulfillment) {
      let tags = [];
      if (typeof(this.state.current_tags) != "undefined"){
        this.state.current_tags.forEach((tag)=> {
          tags.push(
            <div key={tags.length} className={"tag "+tag}>
              {tag}
              {this.props.edit_tags?
                <span style={{cursor:"pointer"}} onClick={this.handleRemoveTag.bind(this, tag)}>✘</span> : null
              }
            </div>
          )
        });
      }

      // Manage garment level tagging buttons
      let tagLogic = {
        "needs_picking": {
          add: [["needs_pressing"]],
          remove: ["new", "needs_picking"],
        },
        "needs_pressing": {
          add: [["needs_qaing"],["needs_picking"]],
          remove: ["needs_pressing"],
        },
        "needs_qaing": {
          add: [["needs_packing"],["needs_pressing"],["needs_picking"]],
          remove: ["needs_qaing"],
        },
        "needs_packing":{
          add: [["shipped"]],
          remove: ["needs_packing"],
        },
        "needs_airbrush": {
          add: [["at_airbrush"]],
          remove: ["needs_airbrush", "new"],
        },
        "needs_embroidery": {
          add: [["at_embroidery"]],
          remove: ["needs_embroidery", "new"],
        },
        "at_embroidery": {
          add: [["needs_packing"],["needs_pressing"]],
          remove: ["at_embroidery"],
        },
        "at_airbrush":{
          add: [["needs_packing"]],
          remove: ["at_airbrush"],
        },
      }

      let adminButtons = [];
      if (typeof(this.state.current_tags) != "undefined"){
        this.state.current_tags.forEach((tagKey, index)=>{
          if (tagLogic.hasOwnProperty(tagKey)){
            let addTags = tagLogic[tagKey]["add"];
            let removeTags = tagLogic[tagKey]["remove"];
            addTags.forEach((aTag)=>{
              adminButtons.push(<button key={aTag} onClick={this.handleTagging.bind(this, aTag,removeTags)}>{aTag}</button>)
            });
          }
        });
      }

      tag_list = (
        <div>
          <div className="taglist">
            {tags}
          </div>
          {this.props.edit_tags?
            <div>
              <div className="add_tag">
                <input type="text"
                  onChange={this.handleInputChange}
                  onKeyUp={(event)=>{if(event.which==13){this.handleAddTag()}}}
                  value={this.state.new_tag}
                  placeholder="enter new tag"
                  name="new_tag"
                />
                <button onClick={this.handleAddTag}>Add Tag</button>
              </div>
              <div>
                {adminButtons}
              </div>
            </div>
            :null}
        </div>
      );
    }

    let style = this.props.style || Item.style;
    let preview_img = this.props.props.image;
    if (preview_img && preview_img.charAt(0)=='/') {
      if (this.props.is_email)
        preview_img = "https://couture.bowanddrape.com"+preview_img;
      else if (typeof(window)!="undefined" && window.location.hostname=="www.bowanddrape.com")
        preview_img = "https://cdn.bowanddrape.com"+preview_img;

    }

    return (
      <div className={className} style={style.item}>
        <a href={this.props.props.url}>
          <img className="preview" src={preview_img} onError={(event)=>{event.target.style.display='none'}}/>
          <img className="preview" src={preview_img?preview_img+"&camera=1":""} onError={(event)=>{event.target.style.display='none'}}/>
          {/*for legacy haute orders, draw the back*/}
          {
            /_front/.test(this.props.props.image) || /_f\.jpg/.test(this.props.props.image) ?
              <img className="preview" src={this.props.props.image?this.props.props.image.replace("_front","_back").replace("_f.jpg","_b.jpg"):undefined} onError={(event)=>{event.target.style.display='none'}}/>
              : null
          }
        </a>
        {tag_list}
        <div className="deets">
          {this.props.fulfillment ?
            <div className="garment_id">
              GarmentID#: {this.props.garment_id},
              <span className="garment_caption">({this.props.shipment_id.substr(this.props.shipment_id.length-6)} {this.props.content_index+1} of {this.props.total_num_products})</span>
            </div>
            : null
          }
          <a href={this.props.props.url}>
            <div className="name">{this.props.props.name}</div>
          </a>
          {info}
          {this.props.onRemove?<button className="remove" onClick={this.handleRemovePromptConfirm.bind(this)} onBlur={this.handleRemoveBlur}>Remove</button>:null}

          {assembly_phrase?<div className="assembly_phrase">{assembly_phrase}</div>:null}
          {assembly}
          {this.props.sku ?
            <Price price={this.props.props.price} quantity={quantity} />
            : null
          }
          <Price total={true} price={this.props.props.price} quantity={quantity} />
        </div>
      </div>
    )
  }

  handleRemovePromptConfirm(event) {
    event.stopPropagation();
    if (event.target.innerHTML=="Are you sure?") {
      this.handleRemoveBlur(event);
      return this.props.onRemove();
    }
    event.target.classList.add("confirm");
    event.target.innerHTML = "Are you sure?";
  }
  handleRemoveBlur(event) {
    event.target.classList.remove("confirm");
    event.target.innerHTML = "Remove";
  }
}

Item.style = style;
Item.style_summary = Object.assign({}, style, style_summary);
module.exports = Item;
