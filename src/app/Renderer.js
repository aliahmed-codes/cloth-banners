import vertexSource from "./shaders/cloth.vert.glsl?raw";
import fragmentSource from "./shaders/cloth.frag.glsl?raw";

export default class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2", { antialias: true, alpha: true });
    this.supported = Boolean(this.gl);
    this.focal = 1100;

    if (!this.supported) return;

    const gl = this.gl;
    this.program = this.createProgram();
    this.locations = {
      pos: gl.getAttribLocation(this.program, "aPos"),
      normal: gl.getAttribLocation(this.program, "aNormal"),
      uv: gl.getAttribLocation(this.program, "aUv"),
      view: gl.getUniformLocation(this.program, "uView"),
      focal: gl.getUniformLocation(this.program, "uFocal"),
      shadow: gl.getUniformLocation(this.program, "uShadow"),
      tex: gl.getUniformLocation(this.program, "uTex"),
    };

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
  }

  compile(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
    }

    return shader;
  }

  createProgram() {
    const gl = this.gl;
    const program = gl.createProgram();
    gl.attachShader(program, this.compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, this.compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program));
    }

    return program;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(window.innerWidth * dpr);
    this.canvas.height = Math.round(window.innerHeight * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  createTexture(source) {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }

  createMesh(cols, rows) {
    const gl = this.gl;
    const uvs = new Float32Array(cols * rows * 2);
    const indices = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = (r * cols + c) * 2;
        uvs[i] = c / (cols - 1);
        uvs[i + 1] = r / (rows - 1);

        if (r + 1 < rows && c + 1 < cols) {
          const a = r * cols + c;
          const b = a + 1;
          const d = a + cols;
          const e = d + 1;
          indices.push(a, b, d, b, e, d);
        }
      }
    }

    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return { uvBuffer, indexBuffer, indexCount: indices.length };
  }

  createBuffer() {
    return this.gl.createBuffer();
  }

  begin() {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.uniform2f(this.locations.view, window.innerWidth, window.innerHeight);
    gl.uniform1f(this.locations.focal, this.focal);
    gl.uniform1i(this.locations.tex, 0);
  }

  pass(shadow) {
    const gl = this.gl;
    gl.uniform1f(this.locations.shadow, shadow ? 1 : 0);
    gl.depthMask(!shadow);
  }

  attribute(location, buffer, data, size) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    if (data) gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  }

  upload(banner) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, banner.posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, banner.cloth.pos, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, banner.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, banner.cloth.normals, gl.DYNAMIC_DRAW);
  }

  draw(banner) {
    const gl = this.gl;
    const { locations } = this;

    this.attribute(locations.pos, banner.posBuffer, null, 3);
    this.attribute(locations.normal, banner.normalBuffer, null, 3);
    this.attribute(locations.uv, banner.mesh.uvBuffer, null, 2);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, banner.mesh.indexBuffer);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, banner.texture);
    gl.drawElements(gl.TRIANGLES, banner.mesh.indexCount, gl.UNSIGNED_SHORT, 0);
  }
}
