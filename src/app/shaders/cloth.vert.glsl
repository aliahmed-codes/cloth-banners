#version 300 es
precision highp float;

in vec3 aPos;
in vec3 aNormal;
in vec2 aUv;

uniform vec2 uView;
uniform float uFocal;

out vec3 vNormal;
out vec2 vUv;

void main() {
  float scale = uFocal / (uFocal - aPos.z);
  vec2 center = uView * 0.5;
  vec2 p = center + (aPos.xy - center) * scale;

  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, -aPos.z / 1500.0, 1.0);
  vNormal = aNormal;
  vUv = aUv;
}
