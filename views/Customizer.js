const async = require('async');
const rayTriangleIntersection = require('ray-triangle-intersection');

const Component = require('./Component.js');
const SylvestorGlUtils = require('sylvester-es6');
const Matrix = SylvestorGlUtils.Matrix;
const Vector = SylvestorGlUtils.Vector;

/***
WebGL customizer view

uses views/Component.js as a renderable facsimile of the usual Component model
***/
class Customizer {
  constructor(options) {
    this.options = options;
    this.options.vfov = this.options.vfov || 45; // vfov in degrees

    this.camera = {
      position: [0, 0, -1],
      rotation: {
        angle: 0,
        axis: [0, 1, 0],
      }
    }

    this.gl = null;

    this.mvMatrix;
    this.mvMatrixStack = [];
    this.shaderProgram;
    this.vertexPositionAttribute;
    this.textureCoordAttribute;
    this.pMatrix;

    this.components = [];
    this.product = new Component();
  }

  set(product, construction, callback) {
    let set_tasks = [];

    let components = [];
    // set product
    if (product)
      set_tasks.push(this.product.set.bind(this.product, this.gl, {props: product.props, geometry:"doublesided"}));
    // recurse assemblies
    if (construction && construction.assembly) {
      construction.assembly.forEach((component) => {
        components.push(component);
      });
    }
    // sync component list the same
    while (this.components.length < components.length) {
      this.components.push(new Component());
    }
    // TODO unbind textures here so we don't leak
    this.components.length = components.length;
    for (let i=0; i<components.length; i++) {
      set_tasks.push(this.components[i].set.bind(this.components[i], this.gl, components[i]));
    }
    async.parallel(set_tasks, (err) => {
      if (callback) callback();
      if (typeof(window)!='undefined') window.requestAnimationFrame(this.render.bind(this));
    });
  }

  // call this on window resize, when we need to re-setup pretty much everything
  resizeViewport() {
    // set canvas space to be 1-to-1 with browser space
    this.gl.viewport(0, 0, this.options.width, this.options.height);
    // f_pixels is useful for a lot of transforms, remember it
    this.focal_length_pixels = this.options.height/2/Math.tan(this.options.vfov*Math.PI/360);

    this.updatePMatrix();
    this.updateCanvasScreenPosition();
  }

  // compute pMatrix, call whenever changing camera or viewport!
  updatePMatrix(camera=undefined) {
    if (camera) this.camera = camera;
    // init pMatrix with view frustrum
    this.pMatrix = SylvestorGlUtils.makePerspective(this.options.vfov, this.options.width/this.options.height, 0.1, 100.0);
    // move camera upwards by elevation
    this.pMatrix = this.translate(this.pMatrix, this.camera.position);
    // rotate camera around origin
    this.pMatrix = this.rotate(this.pMatrix, this.camera.rotation.angle, this.camera.rotation.axis);
    if (typeof(window)!='undefined') window.requestAnimationFrame(this.render.bind(this));
  }

  // call this after appending a child before our canvas!
  updateCanvasScreenPosition() {
    if (!this.options.canvas) return;
    let rect = this.options.canvas.getBoundingClientRect();
    let position = [rect.left + window.scrollX, rect.top + window.scrollY];
    this.canvas_offset = position;
    return position;
  }

  init() {
    this.gl = this.initWebGL();
    let gl = this.gl;

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clearDepth(1.0);
    gl.disable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    this.resizeViewport();
    this.initShaders();

    // init mvMatrix
    this.mvMatrix = Matrix.I(4);
  }

  browserToWorld(browser) {
    return this.screenToWorld([
      browser[0]-this.canvas_offset[0],
      browser[1]-this.canvas_offset[1],
    ]);
  }
  screenToWorld(screen) {
    // get a unit directional vector from camera origin through screen pixel
    let rotY = Math.atan2(screen[0]-(this.options.canvas.offsetWidth/2), this.focal_length_pixels);
    let rotX = Math.atan2(screen[1]-(this.options.canvas.offsetHeight/2), this.focal_length_pixels);
    let screen_direction_world = new Vector([0, 0, 1]);
    // rotate by pixel offset
    screen_direction_world = Matrix.Rotation(rotX, new Vector([1,0,0])).x(screen_direction_world);
    screen_direction_world = Matrix.Rotation(rotY, new Vector([0,1,0])).x(screen_direction_world);
    // rotate by camera
    screen_direction_world = Matrix.Rotation(this.camera.rotation.angle, new Vector(this.camera.rotation.axis)).x(screen_direction_world);

    let geometry_intersection = null;
    let pt = Matrix.Rotation(this.camera.rotation.angle, new Vector(this.camera.rotation.axis)).x(new Vector(this.camera.position.slice(0, 3))).elements;
    let dir = screen_direction_world.elements.slice(0, 3);
    for (let tri_index=0; tri_index<this.product.vertex_indices.length/3; tri_index++) {
      let triangle = []
      for (let i=0; i<3; i++) {
        let index = this.product.vertex_indices[tri_index*3+i];
        triangle.push(this.product.vertices.slice(index*3, index*3+3));
      }

      // the intersect we're using only intersects backfaces and not front?
      // reverse our winding to compensate... -_-
      let swap = triangle[2];
      triangle[2] = triangle[1];
      triangle[1] = swap;
      let intersect = rayTriangleIntersection([], pt, dir, triangle);
      // TODO find the closest intersection, for now I'm just grabbing ANY
      if (intersect) {
        geometry_intersection = intersect;
        break;
      }
    }
    return geometry_intersection;
  }

  worldToScreen(world) {
    world[3] = world[3] || 1;
    let normDeviceCoords = this.pMatrix.x(new Vector([world[0], world[1], world[2], world[3]]));
    let screen = [0, 0, 0, 1];
    screen[0] = normDeviceCoords.elements[0] * this.options.canvas.offsetWidth/2
      + this.options.canvas.offsetWidth/2;
    screen[1] = this.options.canvas.offsetHeight/2 - (normDeviceCoords.elements[1] * this.options.canvas.offsetHeight/2);

    return screen;
  }

  getScreenBoundingBox(component) {
    let rotation_matrix = Matrix.Rotation(component.rotation.angle, new Vector(component.rotation.axis));
    let world_dims = component.getWorldDims();
    let bottom_right = new Vector(component.position).add(rotation_matrix.x(new Vector(world_dims).x(0.5))).elements;
    bottom_right = this.worldToScreen(bottom_right);
    let top_left = new Vector(component.position).subtract(rotation_matrix.x(new Vector(world_dims).x(0.5))).elements;
    top_left = this.worldToScreen(top_left);

    return {
      top_left,
      bottom_right,
    }
  }

  initWebGL() {
    let gl = null;
    try {
      if (this.options.canvas) {
        gl = this.options.canvas.getContext("webgl");
        this.options.canvas.width = this.options.canvas.offsetWidth;
        this.options.canvas.height = this.options.canvas.offsetHeight;
        this.options.width = this.options.canvas.width;
        this.options.height = this.options.canvas.height;
      } else {
        // if we didn't get passed a canvas, we're doing a server side render
        gl = require('gl')(this.options.width, this.options.height);
      }
    }
    catch(e) {}

    if (!gl) {
      console.log("Unable to initialize WebGL. Your browser may not support it.");
    }
    return gl;
  }

  handleTextureLoaded(image, texture) {
    let gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    if (typeof(window)!='undefined') window.requestAnimationFrame(this.render.bind(this));
  }

  render() {
    let gl = this.gl;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // set projection matrix
    let pUniform = gl.getUniformLocation(this.shaderProgram, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(this.pMatrix.flatten()));

    // draw product
    this.product.render(gl, this.mvMatrix, this.shaderProgram);

    // draw components
    for (let i=0; i<this.components.length; i++) {
      this.components[i].render(gl, this.mvMatrix, this.shaderProgram);
    }
  }

  // draw continuously? We shouln't really do this, just call render when
  // anything changes as that'll be way cheaper than redrawing all the time
  animate() {
    this.render();
    window.requestAnimationFrame(this.animate.bind(this));
  }

  initShaders() {
    let gl = this.gl;
    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, `
        varying highp vec2 vTextureCoord;
        uniform sampler2D uSampler;
        void main(void) {
          gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
        }
    `);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.log("An error occurred compiling the shaders: " + gl.getShaderInfoLog(fragmentShader));
    }

    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, `
        attribute vec3 aVertexPosition;
        attribute vec2 aTextureCoord;
        uniform mat4 uMVMatrix;
        uniform mat4 uPMatrix;
        varying highp vec2 vTextureCoord;
        void main(void) {
          gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
          vTextureCoord = aTextureCoord;
        }
    `);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.log("An error occurred compiling the shaders: " + gl.getShaderInfoLog(vertexShader));
    }

    // Create the shader program
    this.shaderProgram = gl.createProgram();
    gl.attachShader(this.shaderProgram, vertexShader);
    gl.attachShader(this.shaderProgram, fragmentShader);
    gl.linkProgram(this.shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
      console.log("Unable to initialize the shader program: " + gl.getProgramInfoLog(shader));
    }

    gl.useProgram(this.shaderProgram);

    this.vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(this.vertexPositionAttribute);

    this.textureCoordAttribute = gl.getAttribLocation(this.shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(this.textureCoordAttribute);
  }

  setMatrixUniforms() {
    let gl = this.gl;
    let mvUniform = gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(this.mvMatrix.flatten()));
  }

  mvPushMatrix(m) {
    if (m) {
      this.mvMatrixStack.push(m.dup());
      this.mvMatrix = m.dup();
    } else {
      this.mvMatrixStack.push(this.mvMatrix.dup());
    }
  }

  mvPopMatrix() {
    if (!this.mvMatrixStack.length) {
      throw("Can't pop from an empty matrix stack.");
    }

    this.mvMatrix = this.mvMatrixStack.pop();
    return this.mvMatrix;
  }

  rotate(m, angle, v) {
    let r = Matrix.Rotation(angle, new Vector([v[0], v[1], v[2]])).ensure4x4();
    return m.x(r);
  }

  translate(m, v) {
    return m.x(Matrix.Translation(new Vector([v[0], v[1], v[2]])).ensure4x4());
  }

  scale(m, v) {
    return m.x(Matrix.Diagonal([v[0], v[1], v[2], 1]));
  }
}

module.exports = Customizer;
