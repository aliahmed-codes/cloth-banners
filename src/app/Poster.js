const THEMES = [
  { bg: "#e8452c", ink: "#17120f", a: "#f2e6cf", b: "#f2b134", shape: "circles" },
  { bg: "#2547d0", ink: "#f2e6cf", a: "#f2c230", b: "#e8452c", shape: "arcs" },
  { bg: "#efe7d6", ink: "#17120f", a: "#e8452c", b: "#2547d0", shape: "stripes" },
  { bg: "#1f4d3a", ink: "#f4d9c0", a: "#f4a98a", b: "#f2c230", shape: "blocks" },
  { bg: "#f3a6c1", ink: "#2a1230", a: "#2a1230", b: "#fff4e6", shape: "triangles" },
  { bg: "#f2c230", ink: "#17120f", a: "#17120f", b: "#e8452c", shape: "grid" },
  { bg: "#26262b", ink: "#f2e6cf", a: "#e8452c", b: "#f2e6cf", shape: "rings" },
];

export default class Poster {
  static get count() {
    return THEMES.length;
  }

  static random(seed) {
    let s = seed * 9301 + 49297;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  static draw(index) {
    const theme = THEMES[index % THEMES.length];
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, 512, 768);

    Poster[theme.shape](ctx, theme, Poster.random(index + 3));
    Poster.type(ctx, theme, index);
    Poster.grain(ctx, Poster.random(index + 11));

    return canvas;
  }

  static circles(ctx, t) {
    ctx.fillStyle = t.a;
    ctx.beginPath();
    ctx.arc(256, 330, 170, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = t.b;
    ctx.beginPath();
    ctx.arc(350, 250, 76, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = t.ink;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(256, 330, 200, 0, Math.PI * 2);
    ctx.stroke();
  }

  static arcs(ctx, t) {
    ctx.lineWidth = 30;

    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = i % 2 ? t.b : t.a;
      ctx.beginPath();
      ctx.arc(256, 520, 60 + i * 46, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
  }

  static stripes(ctx, t) {
    const colors = [t.ink, t.a, t.b];

    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = colors[i % 3];
      ctx.fillRect(40 + i * 48, 140, 36, 400);
    }

    ctx.fillStyle = t.bg;
    ctx.beginPath();
    ctx.arc(256, 340, 96, 0, Math.PI * 2);
    ctx.fill();
  }

  static blocks(ctx, t, random) {
    const colors = [t.a, t.b, t.ink];

    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if (random() < 0.28) continue;
        ctx.fillStyle = colors[Math.floor(random() * 3)];
        const w = 92 + random() * 16;
        ctx.fillRect(48 + x * 106, 150 + y * 100, w, 88);
      }
    }
  }

  static triangles(ctx, t) {
    const fills = [t.a, t.b, t.ink, t.a];

    fills.forEach((fill, i) => {
      ctx.fillStyle = fill;
      ctx.beginPath();
      const x = 70 + (i % 2) * 190;
      const y = 150 + Math.floor(i / 2) * 200;
      ctx.moveTo(x, y + 180);
      ctx.lineTo(x + 90, y);
      ctx.lineTo(x + 180, y + 180);
      ctx.closePath();
      ctx.fill();
    });
  }

  static grid(ctx, t) {
    ctx.strokeStyle = t.a;
    ctx.lineWidth = 6;

    for (let i = 0; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(56 + i * 66, 150);
      ctx.lineTo(56 + i * 66, 546);
      ctx.moveTo(56, 150 + i * 66);
      ctx.lineTo(452, 150 + i * 66);
      ctx.stroke();
    }

    ctx.fillStyle = t.b;
    [[1, 1], [3, 2], [4, 4], [2, 5]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(56 + x * 66 + 33, 150 + y * 66 + 33, 26, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  static rings(ctx, t) {
    ctx.strokeStyle = t.b;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 4;

    for (let i = 1; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(256, 340, i * 28, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = t.a;
    ctx.beginPath();
    ctx.arc(300, 300, 64, 0, Math.PI * 2);
    ctx.fill();
  }

  static type(ctx, t, index) {
    ctx.strokeStyle = t.ink;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, 464, 720);
    ctx.globalAlpha = 1;

    ctx.fillStyle = t.ink;
    ctx.font = "800 22px Inter, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText("LOOSE THREADS", 48, 50);
    ctx.textAlign = "right";
    ctx.fillText(`${index + 1}/${THEMES.length}`, 464, 50);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = "800 200px Inter, sans-serif";
    ctx.fillText(String(index + 1).padStart(2, "0"), 40, 716);
  }

  static grain(ctx, random) {
    for (let i = 0; i < 2400; i++) {
      ctx.fillStyle = random() > 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
      ctx.fillRect(random() * 512, random() * 768, 2, 2);
    }
  }
}
