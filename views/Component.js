
class Component {
  constructor() {
    this.bounds = {
      min: [-4, -4, -5],
      max: [4, 4, -1]
    };
    this.scale = [0.508, 0.508, 1];
    this.position = [0, 0, 0];
    this.velocity = [0, 0, 0];
    this.rotation = 0;
    this.rotation_axis = [
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ];
    this.props = {};
  }

  set(gl, state) {
    // handle image
    if (state.props.image && state.props.image!=this.props.image) {
      let image_load = new Image();
      image_load.crossOrigin = "anonymous";
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
      image_load.src = state.props.image;
    }
    this.props = state.props || {};
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
