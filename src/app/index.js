import Renderer from "./Renderer";
import Carousel from "./Carousel";
import Poster from "./Poster";
import Banner from "./Banner";

class App {
  constructor() {
    this.renderer = new Renderer(document.getElementById("stage"));

    if (!this.renderer.supported) {
      document.documentElement.classList.add("no-gl");
      return;
    }

    this.carousel = new Carousel();
    this.banners = [];
    this.textures = [];
    this.pointer = { x: -999, y: -999, vx: 0, vy: 0, active: false };
    this.time = 0;
    this.accumulator = 0;
    this.step = 1 / 120;
    this.last = performance.now();

    window.addEventListener("pointermove", (event) => this.track(event));
    window.addEventListener("pointerleave", () => (this.pointer.active = false));
    window.addEventListener("resize", () => this.resize());

    document.fonts.load("800 20px Inter").then(() => {
      this.textures = Array.from({ length: Poster.count }, (_, i) =>
        this.renderer.createTexture(Poster.draw(i))
      );
      this.resize();
      requestAnimationFrame((now) => this.tick(now));
    });
  }

  track(event) {
    const p = this.pointer;
    p.vx = event.clientX - p.x;
    p.vy = event.clientY - p.y;
    p.x = event.clientX;
    p.y = event.clientY;
    p.active = true;
  }

  resize() {
    if (!this.textures.length) return;

    this.renderer.resize();

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.max(170, Math.min(vw * 0.24, vh * 0.4, 340));
    const height = width * 1.5;
    const railY = Math.round(vh * 0.13);

    this.width = width;
    this.stride = width * 1.28;
    this.railY = railY;
    document.documentElement.style.setProperty("--rail-y", `${railY}px`);

    const cols = 13;
    const rows = 20;
    const mesh = this.renderer.createMesh(cols, rows);
    const loops = Math.ceil((vw + this.stride * 3) / (this.stride * Poster.count));
    const total = loops * Poster.count;

    this.total = total * this.stride;
    this.low = -this.stride * 1.4;
    this.banners = Array.from({ length: total }, (_, i) => {
      return new Banner(this.renderer, {
        index: i,
        texture: this.textures[i % Poster.count],
        mesh,
        width,
        height,
        railY,
        cols,
        rows,
      });
    });

    this.layout();
  }

  layout() {
    const vw = window.innerWidth;

    this.banners.forEach((banner, i) => {
      const raw = i * this.stride - this.carousel.offset + (vw - this.width) / 2;
      const x = this.low + ((((raw - this.low) % this.total) + this.total) % this.total);
      banner.place(x, this.within(x));
    });
  }

  within(x) {
    return x > -this.stride * 1.1 && x < window.innerWidth + this.stride * 0.1;
  }

  visible(banner) {
    return this.within(banner.x);
  }

  simulate() {
    const sway = Math.abs(this.carousel.speed);
    const p = this.pointer;

    for (const banner of this.banners) {
      if (!this.visible(banner)) continue;

      if (p.active) banner.cloth.push(p.x, p.y, p.vx, p.vy, 90);
      banner.cloth.step(this.time, sway);
    }

    p.vx *= 0.8;
    p.vy *= 0.8;
    this.time += this.step;
  }

  tick(now) {
    const frame = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;

    this.carousel.update(frame);
    this.layout();

    this.accumulator += frame;

    while (this.accumulator >= this.step) {
      this.simulate();
      this.accumulator -= this.step;
    }

    this.renderer.begin();

    for (const banner of this.banners) {
      if (!this.visible(banner)) continue;

      banner.cloth.updateNormals();
      this.renderer.draw(banner);
    }

    requestAnimationFrame((time) => this.tick(time));
  }
}

new App();
