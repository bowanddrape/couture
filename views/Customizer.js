
const Component = require('./Component.js');

class Customizer {
  constructor(options) {
    this.options = options;
    this.options.vfov = this.options.vfov || 45; // vfov in degrees
    this.camera_elevation = this.options.camera_elevation || 0.5;

    this.gl = null;

    this.particleVerticesBuffer;
    this.particleVerticesTextureCoordBuffer;
    this.particleVerticesIndexBuffer;
    this.particleVerticesIndexBuffer;
    this.particleRotation = 0.0;
    this.lastParticleUpdateTime = (new Date).getTime();

    this.particleTexture;

    this.mvMatrix;
    this.mvMatrixStack = [];
    this.shaderProgram;
    this.vertexPositionAttribute;
    this.textureCoordAttribute;
    this.pMatrix;

    this.particles = [];
    for (let i=0; i<12; i++) {
      this.particles.push(new Component());
    }

    this.components = [];
    this.product = new Component();
  }

  set(product, construction) {
    let components = [];
    // set product
    this.product.set(this.gl, {props: product.props});
    // TODO recurse assemblies
    construction.assembly.forEach((component) => {
      components.push(component);
    });
    // sync component list the same
    while (this.components.length < components.length) {
      this.components.push(new Component());
    }
    // TODO unbind textures here so we don't leak
    this.components.length = components.length;
    for (let i=0; i<components.length; i++) {
      this.components[i].set(this.gl, components[i]);
    }
  }

  resizeViewport() {
    // set canvas space to be 1-to-1 with browser space
    this.options.canvas.width = this.options.canvas.offsetWidth;
    this.options.canvas.height = this.options.canvas.offsetHeight;
    this.gl.viewport(0, 0, this.options.canvas.width, this.options.canvas.height);

    // init pMatrix with view frustrum
    this.pMatrix = makePerspective(this.options.vfov, this.options.canvas.width/this.options.canvas.height, 0.1, 100.0);
    // move camera upwards by elevation
    this.pMatrix = this.translate(this.pMatrix, [-0.0, 0.0, -this.camera_elevation]);

    this.focal_length_pixels = this.options.canvas.offsetHeight/2/Math.tan(this.options.vfov*Math.PI/360);

    this.updateCanvasScreenPosition();
  }

  updateCanvasScreenPosition() {
    let position = [0, 0];
    let element = this.options.canvas;
    while (element) {
      if (element.tagName.toLowerCase() == "body") {
        // deal with body scroll seperately
        position[0] += (element.offsetLeft + element.clientLeft);
        position[1] += (element.offsetTop + element.clientTop);
      } else {
        // for all other non-BODY elements
        position[0] += (element.offsetLeft - element.scrollLeft + element.clientLeft);
        position[1] += (element.offsetTop - element.scrollTop + element.clientTop);
      }
      element = element.offsetParent;
    }
    this.canvas_offset = position;
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

    this.resizeViewport();
    this.initShaders();
    this.initBuffers();
    this.initTextures();

    // init mvMatrix
    this.mvMatrix = Matrix.I(4);

    // Set up to draw the scene periodically.
    window.requestAnimationFrame(this.render.bind(this));
  }

  browserToWorld(browser) {
//    let scroll = document.body.scrollTop || document.documentElement.scrollTop;
    return this.screenToWorld([
      browser[0]-this.canvas_offset[0],
      browser[1]-this.canvas_offset[1],
    ]);
  }
  screenToWorld(screen) {
    let ret = [
      screen[0]-(this.options.canvas.offsetWidth/2),
      (this.options.canvas.offsetHeight/2)-screen[1],
      0,
      1
    ];
    ret[0] = ret[0]*this.camera_elevation/this.focal_length_pixels;
    ret[1] = ret[1]*this.camera_elevation/this.focal_length_pixels;
    return ret;
  }
  worldToScreen(world) {
    let ret = [
      world[0]*this.focal_length_pixels/this.camera_elevation+(this.options.canvas.offsetWidth/2),
      (this.options.canvas.offsetHeight/2)-(world[1]*this.focal_length_pixels/this.camera_elevation),
      0,
      1
    ];
    return ret;
  }

  initWebGL() {
    let gl = null;
    try {
      gl = this.options.canvas.getContext("webgl");
    }
    catch(e) {}
    if (!gl) {
      alert("Unable to initialize WebGL. Your browser may not support it.");
    }
    return gl;
  }

  initBuffers() {
    let gl = this.gl;

    // vertex buffer object
    this.particleVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVerticesBuffer);

    let vertices = [
      -0.5, -0.5, 0.0, 
       0.5, -0.5, 0.0, 
       0.5,  0.5, 0.0, 
      -0.5,  0.5, 0.0, 
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // texture coordinate buffer object
    this.particleVerticesTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVerticesTextureCoordBuffer);
    let textureCoordinates = [
      0.0,  1.0,
      1.0,  1.0,
      1.0,  0.0,
      0.0,  0.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

    // index buffer object
    this.particleVerticesIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.particleVerticesIndexBuffer);
    let particleVertexIndices = [
      0,  1,  2,      0,  2,  3,
    ]

    // Now send the element array to GL
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(particleVertexIndices), gl.STATIC_DRAW);
  }

  initTextures() {
    let gl = this.gl;
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    this.particleTexture = gl.createTexture();
    let particleImage = new Image();
    let self = this;
    particleImage.onload = function() {
      self.handleTextureLoaded(particleImage, self.particleTexture);
      for (let i=0; i<self.particles.length; i++)
        self.particles[i].texture = self.particleTexture;
    }
    particleImage.src = "/petal.png";
  }

  handleTextureLoaded(image, texture) {
    let gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  render() {
    let gl = this.gl;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // set projection matrix
    let pUniform = gl.getUniformLocation(this.shaderProgram, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(this.pMatrix.flatten()));

    // Draw the particle by binding the array buffer to the particle's vertices
    // array, setting attributes, and pushing it to GL
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVerticesBuffer);
    gl.vertexAttribPointer(this.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    // Set the texture coordinates attribute for the vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVerticesTextureCoordBuffer);
    gl.vertexAttribPointer(this.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    // Specify geometry
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.particleVerticesIndexBuffer);

    // update time
    let currentTime = (new Date).getTime();
    this.time_delta = currentTime - this.lastParticleUpdateTime;
    this.lastParticleUpdateTime = currentTime;

    // draw product
    this.product.render(gl, this.mvMatrix, this.shaderProgram);

    // draw components
    for (let i=0; i<this.components.length; i++) {
      this.components[i].render(gl, this.mvMatrix, this.shaderProgram);
    }

    for (let i=0; i<this.particles.length; i++) {
      this.particles[i].render(gl, this.mvMatrix, this.shaderProgram);
      this.particles[i].updatePosition(this.time_delta);
    }

    window.requestAnimationFrame(this.render.bind(this));
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
      alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(fragmentShader));
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
      alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(vertexShader));
    }

    // Create the shader program
    this.shaderProgram = gl.createProgram();
    gl.attachShader(this.shaderProgram, vertexShader);
    gl.attachShader(this.shaderProgram, fragmentShader);
    gl.linkProgram(this.shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
      alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(shader));
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
    let r = Matrix.Rotation(angle, $V([v[0], v[1], v[2]])).ensure4x4();
    return m.x(r); 
  }

  translate(m, v) {
    return m.x(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
  }

  scale(m, v) {
    return m.x(Matrix.Diagonal([v[0], v[1], v[2], 1]));
  }
}

module.exports = Customizer;
