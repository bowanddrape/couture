
const React = require('react');
const ItemUtils = require('./ItemUtils.js');
const Price = require('./Price.jsx');

/* I moved the styles to inline for email compatibility, but currently the item
design is still relying on unsupported styles and thus doesn't work */
const style = {};
const style_summary = {}
/***
Draw an Item. Used in views/Items.jsx
props: will mirror a Component model
***/
class Item extends React.Component {

  render() {
    if (!this.props.props) {
      return (
        <div className="item">{JSON.stringify(this.props)}</div>
      );
    }
    let className = "item-product";
    if (new RegExp("^promo:", "i").test(this.props.props.name) && this.props.onRemove)
      className += " promo";
    let inline_style = this.props.style?this.props.style:style;

    let quantity = this.props.quantity || 1;

    let product_options = [];
    for (let i=1; typeof(this.props.props.options)!="undefined" && i<this.props.props.options.length; i++) {
      product_options.push(
        <div key={product_options.length}>{this.props.props.options[i]}</div>
      )
    }

    let assembly = [];
    let assembly_contents = {};
    if (this.props.fulfillment && this.props.assembly) {
      for (let i=0; i<this.props.assembly.length; i++) {
        ItemUtils.recurseAssembly(this.props.assembly[i], (component) => {
          // component.sku example: "letter_sequin_white2_n"
          // split along the _ and grab the last character
          // if the last char is a space, skip it
          if (component.hasOwnProperty('sku')){
            let lastChar = component.sku.split("_").pop();
            if (lastChar == " ") return;
          }
          // haute imported entries will have "text" set
          if (component.props && component.props.image && component.text) {
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
              <div key={assembly.length}><img src={component.props.image}/>{letter_strings.join("  ")}</div>
            );
          } else if (component.props && component.props.image) {
            let sku = component.sku || component.props.name;
            component.quantity = component.quantity || 1;
            if (!assembly_contents[sku])
              assembly_contents[sku] = JSON.parse(JSON.stringify(component));
            else
              assembly_contents[sku].quantity += component.quantity;
          }
        }); // recurseAssembly
      } // this.props.assembly.forEach
      Object.keys(assembly_contents).sort().forEach((sku) => {
        let backgroundImage = `url(${assembly_contents[sku].props.image})`;
        let backgroundSize = `contain`;
        if (assembly_contents[sku].props.imagewidth<assembly_contents[sku].props.imageheight)
          backgroundSize = `${assembly_contents[sku].props.imagewidth/assembly_contents[sku].props.imageheight*100}% 100%`;
        if (assembly_contents[sku].props.imagewidth>assembly_contents[sku].props.imageheight)
          backgroundSize = `100% ${assembly_contents[sku].props.imageheight/assembly_contents[sku].props.imagewidth*100}%`;
        assembly.push(
          <span key={assembly.length} style={{marginRight:"8px"}}>
          <span style={{
            display:"inline-block",
            width:"20px",
            height:"20px",
            backgroundPosition:"center",
            backgroundRepeat:"no-repeat",
            backgroundImage,
            backgroundSize}}
          />
            {assembly_contents[sku].quantity>1?"x"+assembly_contents[sku].quantity:null}
          </span>
        );
      });
      if (assembly.length)
        assembly = (<assembly>{assembly}</assembly>);
    }

    return (
      <div className={className}>
        <a href={this.props.props.url}>
          <img className="preview" src={this.props.props.image?this.props.props.image:""} onError={(event)=>{event.target.style.display='none'}}/>
          <img className="preview" src={this.props.props.image?this.props.props.image+"&camera=1":""} onError={(event)=>{event.target.style.display='none'}}/>
          {/*for legacy haute orders, draw the back*/}
          {
            /_front/.test(this.props.props.image) || /_f\.jpg/.test(this.props.props.image) ?
              <img className="preview" src={this.props.props.image?this.props.props.image.replace("_front","_back").replace("_f.jpg","_b.jpg"):undefined} onError={(event)=>{event.target.style.display='none'}}/>
              : null
          }
        </a>
        <div className="deets" >
          <a href={this.props.props.url}>
            <div className="name">{this.props.props.name}</div>
          </a>
          {product_options}
          {this.props.onRemove?<button className="remove" onClick={this.handleRemovePromptConfirm.bind(this)} onBlur={this.handleRemoveBlur}>Remove</button>:null}

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
