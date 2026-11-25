import Cloth from "./Cloth";

export default class Banner {
  constructor(renderer, { index, texture, mesh, width, height, railY, cols, rows }) {
    this.index = index;
    this.texture = texture;
    this.mesh = mesh;
    this.cloth = new Cloth({ cols, rows, width, height, x: 0, railY, seed: index * 1.7 });
    this.posBuffer = renderer.createBuffer();
    this.normalBuffer = renderer.createBuffer();
    this.x = 0;
    this.placed = false;
  }

  place(x, awake) {
    if (awake && this.placed) this.cloth.setX(x);
    else this.cloth.teleport(x);

    this.placed = true;
    this.x = x;
  }
}
