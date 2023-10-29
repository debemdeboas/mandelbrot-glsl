precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_zoomCenter;
uniform float u_zoomSize;
uniform int u_maxIterations;

vec2 f(vec2 x, vec2 c) {
  return mat2(x, -x.y, x.x) * x + c;
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

float mandelbrot(vec2 c) {
  float c2 = dot(c, c);
  if ((256.0 * c2 * c2 - 96.0 * c2 + 32.0 * c.x - 3.0 < 0.0) ||
    (16.0 * (c2 + 2.0 * c.x + 1.0) - 1.0 < 0.0)) {
    return 0.0;
  }

  const float B = 512.0;
  float l = 0.0;
  vec2 z = vec2(0.0);
  for (int i = 0; i < 512; i++) {
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if (dot(z, z) > (B * B)) {
      break;
    }
    l += 1.0;
  }

  if (l > 511.0) {
    return 0.0;
  }

  float sl = l - log2(log2(dot(z, z))) + 0.0;
  l = mix(l, sl, 1.0);

  return l;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 c = u_zoomCenter + (uv * 4.0 - vec2(2.0)) * (u_zoomSize / 4.0);
  float l = mandelbrot(c);
  vec3 color = vec3(0.0);
  color += 0.4 + 0.5 * cos(3.0 + l * 0.15 + vec3(0.5, 0.7, 1.));
  gl_FragColor = vec4(color, 1.0);
  // vec2 uv = gl_FragCoord.xy / u_resolution;
  // vec2 c = u_zoomCenter + (uv * 4.0 - vec2(2.0)) * (u_zoomSize / 4.0);
  // vec2 x = vec2(0.0);
  // bool escaped = false;
  // int iterations = 0;
  // for (int i = 0; i < 1000000; i++) {
  //   if (i > u_maxIterations)
  //     break;
  //   iterations = i;
  //   x = f(x, c);
  //   if (length(x) > 2.0) {
  //     escaped = true;
  //     break;
  //   }
  // }
  // gl_FragColor = escaped ? vec4(palette(float(iterations) / float(100), vec3(0.0), vec3(0.59, 0.55, 0.75), vec3(0.1, 0.2, 0.3), vec3(0.75)), 1.0) : vec4(vec3(0.85, 0.99, 1.0), 1.0);
}