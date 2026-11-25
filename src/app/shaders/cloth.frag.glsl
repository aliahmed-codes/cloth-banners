#version 300 es
precision highp float;

in vec3 vNormal;
in vec2 vUv;

uniform sampler2D uTex;
uniform float uShadow;

out vec4 outColor;

const vec3 LIGHT = normalize(vec3(-0.4, -0.6, 0.7));

void main() {
  if (uShadow > 0.5) {
    float edge = smoothstep(0.0, 0.07, min(vUv.x, 1.0 - vUv.x)) * smoothstep(0.0, 0.05, 1.0 - vUv.y);
    outColor = vec4(0.0, 0.0, 0.0, 0.34 * edge);
    return;
  }

  vec3 n = normalize(vNormal);
  float crease = clamp(length(fwidth(vNormal)) * 1.5, 0.0, 0.4);
  bool front = n.z > 0.0;

  vec2 uv = front ? vUv : vec2(1.0 - vUv.x, vUv.y);
  vec3 color = texture(uTex, uv).rgb;

  if (!front) {
    n = -n;
    color = mix(color, vec3(dot(color, vec3(0.3, 0.59, 0.11))), 0.35) * 0.7;
  }

  float diffuse = max(dot(n, LIGHT), 0.0);
  float sheen = pow(1.0 - abs(n.z), 2.0) * 0.14;
  float weave = 1.0 + 0.035 * sin(vUv.x * 620.0) * sin(vUv.y * 880.0);

  vec3 lit = color * (0.38 + diffuse * 0.78) * weave * (1.0 - crease) + sheen;
  outColor = vec4(lit, 1.0);
}
