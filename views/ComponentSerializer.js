
const zlib = require('zlib');

/***
Handle conversion between a customization object and a string representation

parse() and stringify() are the entry points here. zlib compression is used so
we need to be careful when passing along in GET params as we need to watch for
'/' and ' ' characters.
In order to reconstitute a serialzed customization, you pretty much need to have
an instance of views/ProductList.jsx, call preprocessProps(), and componentWillMount() in order to fill in the component fields from the db
***/
class ComponentSerializer {
  constructor() {
  }

  // I made this sync as it's currently called in a react ComponentWillMount
  static parse(component_string) {
    if (!component_string) return null;
    // uri encoding and decoding means that '+' may be read as ' '
    component_string = component_string.replace(/ /g, "+");
    const buffer = Buffer.from(component_string, 'base64');
    let customization;
    try {
      customization = zlib.unzipSync(buffer).toString();
    } catch(err) {
      return null;
    }
    return JSON.parse(customization);
  }

  static stringify(component, callback) {
    let ret = JSON.parse(JSON.stringify(component));
    ComponentSerializer.stripVolatile(ret);
    ret.version = 0;
    ret = JSON.stringify(ret);
    zlib.deflate(ret, {level:1}, (err, buffer) => {
      callback(err, buffer.toString('base64'));
    });
  }

  // basically we need to strip everything that isn't specifically related to
  // the user's customization. This is for space as well as to make sure that
  // we don't keep any dirty information from a previous component db setting!
  static stripVolatile(component) {
    let whitelist = [
      "sku", "props", "assembly", "selected_product", "version"
    ];
    let whitelist_props = [
      "position", "rotation"
    ];
    for (let key in component)
      if (whitelist.indexOf(key)==-1)
        delete component[key];
    for (let prop in component.props)
      if (whitelist_props.indexOf(prop)==-1)
        delete component.props[prop];
    if (component.props && !Object.keys(component.props).length)
      delete component.props;
    if (component.assembly && !component.assembly.length)
      delete component.assembly;
    // recurse assembly
    if (component.assembly) {
      component.assembly.forEach((assembly_component) => {
        ComponentSerializer.stripVolatile(assembly_component);
      });
    }
  }
}

module.exports = ComponentSerializer;
