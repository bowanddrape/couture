
const async = require('async');
const SylvestorGlUtils = require('sylvester-es6');
const Matrix = SylvestorGlUtils.Matrix;
const Vector = SylvestorGlUtils.Vector;

/***
Describe a component for the Customizer to draw
***/
class Component {
  constructor() {
    this.scale = [1, 1, 1];
    // TODO combine position + rotation into a single transform, they're split
    // because I always go "lemme just use a fucking quaternion" and it's
    // always a bad idea
    this.position = [0, 0, 0];
    this.rotation = Matrix.I(4);
    this.props = {};
    this.assembly = [];
    this.loading_image = false;
  }

  loadImage(gl, state, callback) {
    let imageLoadedCallback = (gl, loaded_image) => {
      gl.deleteTexture(this.texture);
      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, loaded_image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      // mipmapping the sequins looks bad?
      //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);
      this.loading_image = false;
    };

    // bail if we don't have to do anything
    if (!state.props || !state.props.image || state.props.image==this.props.image) {
      if (callback) callback();
      return;
    }
    if (typeof(Image)!="undefined") {
      this.loading_image = true;
      // client side image load
      let loaded_image = new Image();
      loaded_image.crossOrigin = "";
      loaded_image.onload = () => {
        if (this.texture) {
          gl.deleteTexture(this.texture)
        }

        // special handling if image is not power of 2
        let isPowerOfTwo = (x) => {return (x & (x - 1)) == 0;}
        let nextHighestPowerOfTwo = (x) => {
          --x;
          for (var i = 1; i < 32; i <<= 1) { x = x | x >> i; }
          return x + 1;
        }
        if (!isPowerOfTwo(loaded_image.width) || !isPowerOfTwo(loaded_image.height)) {
            // Scale up the texture to the next highest power of two dimensions.
            let canvas = document.createElement("canvas");
            canvas.width = nextHighestPowerOfTwo(loaded_image.width);
            canvas.height = nextHighestPowerOfTwo(loaded_image.height);
            let ctx = canvas.getContext("2d");
            ctx.drawImage(loaded_image, 0, 0, canvas.width, canvas.height);
            loaded_image = canvas;
        }
        imageLoadedCallback(gl, loaded_image);
        if (callback) callback(null);
      }
      // mobile needs cachebust or it won't load it?
      loaded_image.src = state.props.image+"?cachebust="+(new Date());
    } else {
      // server side image load
      const getPixels = require("get-pixels")
      getPixels(state.props.image, (err, loaded_image) => {
        if (err) {
          console.log(`error loading image ${state.props.image} ${err}`);
          if (callback) callback(err);
          return;
        }
        if (typeof(ImageData)!="undefined")
          imageLoadedCallback(gl, new ImageData(new Uint8ClampedArray(loaded_image.data), loaded_image.shape[0], loaded_image.shape[1]));
        else
          imageLoadedCallback(gl, {data:new Uint8ClampedArray(loaded_image.data), width:loaded_image.shape[0], height:loaded_image.shape[1]});
        if (callback) callback(null);
      });
    }
  }
  set(gl, state, callback) {
    let sub_tasks = [];
    if (!state.props) return callback("Component.set() called empty state");
    this.scale[0] = parseFloat(state.props.imagewidth) || 1;
    this.scale[1] = parseFloat(state.props.imageheight) || 1;
    if (state.props.position) {
      this.position[0] = parseFloat(state.props.position[0]) || 0;
      this.position[1] = parseFloat(state.props.position[1]) || 0;
    }
    if (state.props.rotation && state.props.rotation.elements) {
      this.rotation = new Matrix(state.props.rotation.elements);
    }
    // fill out if we got an internal assembly
    state.assembly = state.assembly || [];
    if (state.assembly) {
      while (this.assembly.length < state.assembly.length) {
        this.assembly.push(new Component());
      }
      // TODO unbind textures here so we don't leak
      this.assembly.length = state.assembly.length;
      for (let i=0; i<this.assembly.length; i++) {
        sub_tasks.push(this.assembly[i].set.bind(this.assembly[i], gl, state.assembly[i]));
      }
    } else {
      this.assembly = [];
    }
    // handle image
    sub_tasks.push(this.loadImage.bind(this, gl, state));
    async.parallel(sub_tasks, () => {
      this.props = state.props || {};
      if (callback) callback();
    });
    // TODO handle passing in geometries
    if (state.geometry) {
      if (typeof(state.geometry)=="object") {
        console.log("not yet supporting custom component geometry");
      } else if (state.geometry=="doublesided") {
        this.loadDoubleBillboard(gl);
      }
    } else {
      this.loadSingleBillboard(gl);
    }
  }

  loadGeometry(gl, vertices, texture_coords, vertex_indices) {
    this.vertices = vertices;
    this.texture_coods = texture_coords;
    this.vertex_indices = vertex_indices;
    // vertex buffer object
    if (!this.geometry_vbo)
      this.geometry_vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.geometry_vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // texture coordinate buffer object
    if (!this.texture_vbo)
      this.texture_vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texture_vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture_coords), gl.STATIC_DRAW);

    // index buffer object
    if (!this.ibo)
      this.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertex_indices), gl.STATIC_DRAW);
  }
  // helper function that sets up a simple square
  loadSingleBillboard(gl) {
    let vertices = [
      -0.5, -0.5, 0.0,
       0.5, -0.5, 0.0,
       0.5,  0.5, 0.0,
      -0.5,  0.5, 0.0,
    ];
    let texture_coords = [
      0.0,  1.0,
      1.0,  1.0,
      1.0,  0.0,
      0.0,  0.0,
    ];
    let vertex_indices = [
      0,  1,  2,
      0,  2,  3,
    ]
    this.loadGeometry(gl, vertices, texture_coords, vertex_indices);
  }
  // helper function that sets up a double-sided square
  loadDoubleBillboard(gl) {
    let vertices = [
      -0.5, -0.5, 0.0,
       0.5, -0.5, 0.0,
       0.5,  0.5, 0.0,
      -0.5,  0.5, 0.0,
       0.5, -0.5, 0.01,
      -0.5, -0.5, 0.01,
      -0.5,  0.5, 0.01,
       0.5,  0.5, 0.01,
    ];
    let texture_coords = [
      0.0,  1.0,
      0.5,  1.0,
      0.5,  0.0,
      0.0,  0.0,
      0.5,  1.0,
      1.0,  1.0,
      1.0,  0.0,
      0.5,  0.0,
    ];
    let vertex_indices = [
      0,  1,  2,
      0,  2,  3,
      4,  5,  6,
      4,  6,  7,
    ]
    this.loadGeometry(gl, vertices, texture_coords, vertex_indices);
  }

  render(gl, mvMatrix, shaderProgram) {

    if(!this.geometry_vbo || !this.texture_vbo || !this.ibo || this.loading_image) {
      return;
    }

    // Draw the particle by binding the array buffer to the particle's vertices
    // array, setting attributes, and pushing it to GL
    gl.bindBuffer(gl.ARRAY_BUFFER, this.geometry_vbo);
    let vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    // Set the texture coordinates attribute for the vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texture_vbo);
    let textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(textureCoordAttribute);
    gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
    // Specify geometry
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);

    // TODO pre-multiply these into a single transform matrix
    let modelview;
    modelview = mvMatrix.x(Matrix.Translation(new Vector([this.position[0], this.position[1], this.position[2]])).ensure4x4());

    let rotation_matrix = new Matrix(this.rotation.elements);
    let rotation_matrix_inv = rotation_matrix.inv();
    modelview = modelview.x(rotation_matrix);
    modelview = modelview.x(Matrix.Diagonal([this.scale[0], this.scale[1], this.scale[2], 1]));
    let mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(modelview.flatten()));
    if (this.texture) {
      gl.activeTexture(gl.TEXTURE0 + 1);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 1);

      gl.drawElements(gl.TRIANGLES, this.vertex_indices.length, gl.UNSIGNED_SHORT, 0);
    }

    let width = this.getWorldDims()[0];
    modelview = rotation_matrix.x(Matrix.Translation(new Vector([-width/2, 0, 0])).ensure4x4().x(rotation_matrix_inv.x(modelview)));
    for (let i=0; i<this.assembly.length; i++) {
      modelview = rotation_matrix.x(Matrix.Translation(new Vector([this.assembly[i].scale[0]/2, 0, 0])).ensure4x4().x(rotation_matrix_inv.x(modelview)));

      this.assembly[i].render(gl, modelview, shaderProgram);

      modelview = rotation_matrix.x(Matrix.Translation(new Vector([this.assembly[i].scale[0]/2, 0, 0])).ensure4x4().x(rotation_matrix_inv.x(modelview)));
    }

  }

  getWorldDims() {
    if (!this.assembly || !this.assembly.length)
      return [
        this.scale[0],
        this.scale[1]
      ];
    let width = 0;
    let height = 0;
    let samples = 0;
    this.assembly.forEach((component) => {
      let dim = component.getWorldDims();
      width += dim[0];
      height = (dim[1] + height*samples)/(samples+1);
      samples++;
    });
    return [width, height, 0];
  }

  getWorldBoundingBox() {
    let dims = this.getWorldDims();
    let position = new Vector([
      this.position[0],
      this.position[1],
      this.position[2],
      1,
    ]);

    let top_left = new Vector([-dims[0]/2, -dims[1]/2, 0, 1]);
    let bottom_left = new Vector([-dims[0]/2, dims[1]/2, 0, 1]);
    let top_right = new Vector([dims[0]/2, -dims[1]/2, 0, 1]);
    let bottom_right = new Vector([dims[0]/2, dims[1]/2, 0, 1]);

    top_left = position.add(this.rotation.x(top_left));
    bottom_left = position.add(this.rotation.x(bottom_left));
    top_right = position.add(this.rotation.x(top_right));
    bottom_right = position.add(this.rotation.x(bottom_right));
    return {top_left, bottom_left, top_right, bottom_right};
  }
}

module.exports = Component;
