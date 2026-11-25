export default class Cloth {
  constructor({ cols, rows, width, height, x, railY, seed }) {
    this.cols = cols;
    this.rows = rows;
    this.width = width;
    this.height = height;
    this.x = x;
    this.railY = railY;
    this.seed = seed;
    this.count = cols * rows;
    this.pos = new Float32Array(this.count * 3);
    this.prev = new Float32Array(this.count * 3);
    this.normals = new Float32Array(this.count * 3);
    this.gravity = 0.16;
    this.damping = 0.992;
    this.iterations = 10;
    this.links = [];

    this.layout();
    this.connect();
  }

  layout() {
    const dx = this.width / (this.cols - 1);
    const dy = this.height / (this.rows - 1);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const i = (r * this.cols + c) * 3;
        this.pos[i] = this.x + c * dx;
        this.pos[i + 1] = this.railY + r * dy;
        this.pos[i + 2] = 0;
      }
    }

    this.prev.set(this.pos);
  }

  index(r, c) {
    return r * this.cols + c;
  }

  addLink(a, b, stiffness) {
    const i = a * 3;
    const j = b * 3;
    const dx = this.pos[i] - this.pos[j];
    const dy = this.pos[i + 1] - this.pos[j + 1];
    this.links.push({ a, b, rest: Math.hypot(dx, dy), stiffness });
  }

  connect() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const here = this.index(r, c);

        if (c + 1 < this.cols) this.addLink(here, this.index(r, c + 1), 1);
        if (r + 1 < this.rows) this.addLink(here, this.index(r + 1, c), 1);
        if (c + 1 < this.cols && r + 1 < this.rows) {
          this.addLink(here, this.index(r + 1, c + 1), 0.8);
          this.addLink(this.index(r, c + 1), this.index(r + 1, c), 0.8);
        }
        if (c + 2 < this.cols) this.addLink(here, this.index(r, c + 2), 0.25);
        if (r + 2 < this.rows) this.addLink(here, this.index(r + 2, c), 0.25);
      }
    }
  }

  setX(x) {
    this.x = x;
  }

  teleport(x) {
    const shift = x - this.x;

    for (let i = 0; i < this.count * 3; i += 3) {
      this.pos[i] += shift;
      this.prev[i] += shift;
    }

    this.x = x;
  }

  pinTop() {
    const dx = this.width / (this.cols - 1);

    for (let c = 0; c < this.cols; c++) {
      const i = c * 3;
      this.pos[i] = this.x + c * dx;
      this.pos[i + 1] = this.railY;
      this.pos[i + 2] = 0;
      this.prev[i] = this.pos[i];
      this.prev[i + 1] = this.pos[i + 1];
      this.prev[i + 2] = 0;
    }
  }

  integrate(time, sway) {
    const { pos, prev, cols, rows } = this;

    for (let r = 1; r < rows; r++) {
      const depth = r / (rows - 1);

      for (let c = 0; c < cols; c++) {
        const i = (r * cols + c) * 3;
        const wave = Math.sin(time * 1.4 + r * 0.45 + c * 0.3 + this.seed);
        const billow = wave * (0.012 + sway * 0.00004) * depth;

        const vx = (pos[i] - prev[i]) * this.damping;
        const vy = (pos[i + 1] - prev[i + 1]) * this.damping;
        const vz = (pos[i + 2] - prev[i + 2]) * this.damping;

        prev[i] = pos[i];
        prev[i + 1] = pos[i + 1];
        prev[i + 2] = pos[i + 2];

        pos[i] += vx;
        pos[i + 1] = Math.max(this.railY + 2, pos[i + 1] + vy + this.gravity);
        pos[i + 2] = Math.max(-320, Math.min(320, pos[i + 2] + vz + billow));
      }
    }
  }

  solve() {
    const { pos, cols } = this;

    for (let k = 0; k < this.iterations; k++) {
      for (const link of this.links) {
        const i = link.a * 3;
        const j = link.b * 3;
        const dx = pos[j] - pos[i];
        const dy = pos[j + 1] - pos[i + 1];
        const dz = pos[j + 2] - pos[i + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001;
        const diff = ((dist - link.rest) / dist) * link.stiffness;
        const wa = link.a < cols ? 0 : 1;
        const wb = link.b < cols ? 0 : 1;
        const total = wa + wb;

        if (!total) continue;

        const fa = (wa / total) * diff;
        const fb = (wb / total) * diff;

        pos[i] += dx * fa;
        pos[i + 1] += dy * fa;
        pos[i + 2] += dz * fa;
        pos[j] -= dx * fb;
        pos[j + 1] -= dy * fb;
        pos[j + 2] -= dz * fb;
      }
    }
  }

  step(time, sway) {
    this.pinTop();
    this.integrate(time, sway);
    this.solve();
  }

  push(px, py, vx, vy, radius) {
    const { pos, cols } = this;

    for (let i = cols; i < this.count; i++) {
      const k = i * 3;
      const dx = pos[k] - px;
      const dy = pos[k + 1] - py;
      const dist = Math.hypot(dx, dy);

      if (dist > radius) continue;

      const falloff = 1 - dist / radius;
      pos[k] += vx * falloff * 0.35;
      pos[k + 1] += vy * falloff * 0.2;
      pos[k + 2] -= falloff * 5;
    }
  }

  updateNormals() {
    const { pos, normals, cols, rows } = this;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const left = this.index(r, Math.max(c - 1, 0)) * 3;
        const right = this.index(r, Math.min(c + 1, cols - 1)) * 3;
        const up = this.index(Math.max(r - 1, 0), c) * 3;
        const down = this.index(Math.min(r + 1, rows - 1), c) * 3;

        const ux = pos[right] - pos[left];
        const uy = pos[right + 1] - pos[left + 1];
        const uz = pos[right + 2] - pos[left + 2];
        const vx = pos[down] - pos[up];
        const vy = pos[down + 1] - pos[up + 1];
        const vz = pos[down + 2] - pos[up + 2];

        let nx = uy * vz - uz * vy;
        let ny = uz * vx - ux * vz;
        let nz = ux * vy - uy * vx;
        const len = Math.hypot(nx, ny, nz) || 1;

        const i = this.index(r, c) * 3;
        normals[i] = nx / len;
        normals[i + 1] = ny / len;
        normals[i + 2] = nz / len;
      }
    }
  }
}
