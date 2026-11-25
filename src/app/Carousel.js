export default class Carousel {
  constructor() {
    this.offset = 0;
    this.previous = 0;
    this.velocity = 0;
    this.speed = 0;
    this.dragging = false;
    this.lastX = 0;
    this.lastTime = 0;
    this.maxSpeed = 4200;

    window.addEventListener("pointerdown", (event) => this.down(event));
    window.addEventListener("pointermove", (event) => this.move(event));
    window.addEventListener("pointerup", () => this.up());
    window.addEventListener("pointercancel", () => this.up());
    window.addEventListener("wheel", (event) => this.wheel(event), { passive: true });
    window.addEventListener("keydown", (event) => this.key(event));
  }

  clamp(value) {
    return Math.max(-this.maxSpeed, Math.min(this.maxSpeed, value));
  }

  down(event) {
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastTime = performance.now();
    document.body.classList.add("is-dragging");
  }

  move(event) {
    if (!this.dragging) return;

    const now = performance.now();
    const dt = Math.max((now - this.lastTime) / 1000, 0.001);
    const dx = event.clientX - this.lastX;

    this.offset -= dx;
    this.velocity += (this.clamp(-dx / dt) - this.velocity) * 0.35;
    this.lastX = event.clientX;
    this.lastTime = now;
  }

  up() {
    this.dragging = false;
    document.body.classList.remove("is-dragging");
  }

  wheel(event) {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    this.velocity = this.clamp(this.velocity + delta * 2.4);
  }

  key(event) {
    if (event.key === "ArrowRight") this.velocity = this.clamp(this.velocity + 1400);
    if (event.key === "ArrowLeft") this.velocity = this.clamp(this.velocity - 1400);
  }

  update(dt) {
    if (this.dragging) {
      this.velocity *= Math.exp(-9 * dt);
    } else {
      this.offset += this.velocity * dt;
      this.velocity *= Math.exp(-2.6 * dt);
    }

    this.speed = (this.offset - this.previous) / dt;
    this.previous = this.offset;
  }
}
