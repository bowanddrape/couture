
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
  }

  handleRemoveTag(tag) {
    // TODO also log metrics
    let remove_tags = [tag];
    let payload = {
      id: this.props.shipment_id,
      content_index: this.props.content_index,
      remove_tags,
    }

    BowAndDrape.api("POST", "/shipment/tagcontent", payload, (err, results) =>  {
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

    let product_options = [];
    for (let i=1; typeof(this.props.props.options)!="undefined" && i<this.props.props.options.length; i++) {
      product_options.push(
        <div key={product_options.length}>{this.props.props.options[i]}</div>
      )
    }

    let assembly_phrase = "";
    let assembly = [];
    let assembly_contents = {};
    if (this.props.fulfillment && this.props.assembly) {
      for (let i=0; i<this.props.assembly.length; i++) {
        ItemUtils.recurseAssembly(this.props.assembly[i], (component) => {
          // haute imported entries will have "text" set
          if (component.props && component.props.image && component.text) {
            assembly_phrase += component.text;
            let letters = {};
            component.text.split("").forEach((letter) => {
              // Skip spaces
              if (letter != " "){
                if (letters[letter])
                  return letters[letter].quantity += 1;
                letters[letter] = {letter, quantity:1};
              }
            });
            let letter_strings = [];
            Object.keys(letters).sort().forEach((letter) => {
              if (letters[letter].quantity==1)
                return letter_strings.push(letters[letter].letter);
              letter_strings.push(letters[letter].letter+"x"+letters[letter].quantity);
            });
            assembly.push(
              <div key={assembly.length} className="legacy"><img src={component.props.image}/>{letter_strings.join("  ")}</div>
            );
            return;
          }

          let sku = component.sku || component.props.name;

          // ignore anything you can't see
          if (!component.props || !component.props.image) return;
          let last_sku_tok = sku.split("_").pop();
          assembly_phrase += last_sku_tok;
          // skip skus corresponding to spaces
          if (last_sku_tok == " ") return;

          component.quantity = component.quantity || 1;
          if (!assembly_contents[sku])
            assembly_contents[sku] = JSON.parse(JSON.stringify(component));
          else
            assembly_contents[sku].quantity += component.quantity;
        }); // recurseAssembly
        assembly_phrase += " ";
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
      if (this.state.current_tags) {
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
      tag_list = (
        <div>
          <div className="taglist">
            {tags}
          </div>
          {this.props.edit_tags?
            <div className="add_tag">
              <input type="text"
                onChange={(event)=>{this.setState({new_tag:event.target.value})}}
                onKeyUp={(event)=>{if(event.which==13){this.handleAddTag()}}}
                value={this.state.new_tag}
                placeholder="enter new tag"
                name="new_tag"
              />
              <button onClick={this.handleAddTag}>Add Tag</button>
            </div> :null
          }
        </div>
      );
    }

    let style = this.props.style || Item.style;
    let preview_img = this.props.props.image;
    if (preview_img && this.props.is_email)
      preview_img = "https://couture.bowanddrape.com"+preview_img;

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
              <span className="garment_caption">({this.props.shipment_id.substr(this.props.shipment_id.length-4)} {this.props.content_index+1} of {this.props.total_num_products})</span>
            </div>
            : null
          }
          <a href={this.props.props.url}>
            <div className="name">{this.props.props.name}</div>
          </a>
          {product_options}
          {this.props.onRemove?<button className="remove" onClick={this.handleRemovePromptConfirm.bind(this)} onBlur={this.handleRemoveBlur}>Remove</button>:null}

          {assembly_phrase?<div className="assembly_phrase">{assembly_phrase}</div>:null}
          {assembly}
          {this.props.sku ?
            <Price price={this.props.props.price} quantity={quantity} />
            : null
          }
          <Price  price={this.props.props.price*quantity} />
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
