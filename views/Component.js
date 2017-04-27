
class Component {
  constructor() {
    this.bounds = {
      min: [-4, -4, -5],
      max: [4, 4, -1]
    };
    this.scale = [1, 1, 1];
    this.position = [0, 0, 0];
    this.velocity = [0, 0, 0];
    this.rotation = 0;
    this.rotation_axis = [
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ];
    this.props = {};
    this.assembly = [];
  }

  set(gl, state) {
    // handle image
    if (state.props.image && state.props.image!=this.props.image) {
      let image_load = new Image();
      image_load.crossOrigin = "";
      image_load.onload = () => {
        if (this.texture) {
          gl.deleteTexture(this.texture)
        }
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image_load);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
      }
      // mobile needs cachebust or it won't load it?
      image_load.src = state.props.image+"?cachebust="+(new Date());
    }
    this.scale[0] = state.props.imagewidth || 1;
    this.scale[1] = state.props.imageheight || 1;
    this.props = state.props || {};
    // fill out if we got an internal assembly
    state.assembly = state.assembly || [];
    if (state.assembly) {
      while (this.assembly.length < state.assembly.length) {
        this.assembly.push(new Component());
      }
      // TODO unbind textures here so we don't leak
      this.assembly.length = state.assembly.length;
      for (let i=0; i<this.assembly.length; i++) {
        this.assembly[i].set(gl, state.assembly[i]);
      }
    } else {
      this.assembly = [];
    }
  }

  render(gl, mvMatrix, shaderProgram) {

    // TODO pre-multiply these into a single transform matrix
    let modelview;
    modelview = mvMatrix.x(Matrix.Translation($V([this.position[0], this.position[1], this.position[2]])).ensure4x4());

    modelview = modelview.x(Matrix.Rotation(this.rotation, $V([this.rotation_axis[0], this.rotation_axis[1], this.rotation_axis[2]])).ensure4x4());
    modelview = modelview.x(Matrix.Diagonal([this.scale[0], this.scale[1], this.scale[2], 1]));
    let mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(modelview.flatten()));
    if (this.texture) {
      gl.activeTexture(gl.TEXTURE0 + 1);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 1);

      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    let width = this.getWorldWidth();
    modelview = Matrix.Translation($V([-width/2, 0, 0])).ensure4x4().x(modelview);
    for (let i=0; i<this.assembly.length; i++) {
      modelview = Matrix.Translation($V([this.assembly[i].scale[0]/2, 0, 0])).ensure4x4().x(modelview);
      this.assembly[i].render(gl, modelview, shaderProgram);
      modelview = Matrix.Translation($V([this.assembly[i].scale[0]/2, 0, 0])).ensure4x4().x(modelview);
    }

  }

  getWorldWidth() {
    if (!this.assembly || !this.assembly.length)
      return this.scale[0];
    let width = 0;
    this.assembly.forEach((component) => {
      width += component.scale[0];
    });
    return width;
  }

  randomizePosition() {
    this.position = [
      Math.random()*(this.bounds.max[0]-this.bounds.min[0]) + this.bounds.min[0],
      this.bounds.max[1],
      Math.random()*(this.bounds.max[2]-this.bounds.min[2]) + this.bounds.min[2]
    ];
    this.velocity = [0, 0, 0];
  }

  isOutOfBounds() {
    return this.position[0]<this.bounds.min[0] || this.position[0]>this.bounds.max[0]||this.position[1]<this.bounds.min[1] || this.position[1]>this.bounds.max[1]||this.position[2]<this.bounds.min[2] || this.position[2]>this.bounds.max[2];
  }

  updatePosition(time) {
    // rotate
    this.rotation += (30 * time) / 100000.0;

    // gravity
    if (this.velocity[1]>-.001) {
      this.velocity[1] -= 0.000001;
    }

    // random drift
    for (var i=0; i<3; i++) {
      if (Math.abs(this.velocity[i])<0.001) {
        this.velocity[i] += Math.random()*0.00002 - 0.00001;
      } else {
        this.velocity[i] *= 0.9;
      }
    }

    // update position
    for (var i=0; i<3; i++) {
      this.position[i] += this.velocity[i] * time;
    }

    // respawn if out of bounds
    if (this.isOutOfBounds()) {
      this.randomizePosition();
    }
  }
}

module.exports = Component;
