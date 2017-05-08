
const zlib = require('zlib');

class ComponentSerializer {
  constructor() {
  }

  // I made this sync as it's currently called in a react ComponentWillMount
  static parse(component_string) {
    const buffer = Buffer.from(component_string, 'base64');
    let customization = zlib.unzipSync(buffer).toString();
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
