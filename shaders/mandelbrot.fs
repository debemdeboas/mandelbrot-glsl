precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_zoomCenter;
uniform float u_zoomSize;
uniform int u_maxIterations;
uniform vec3 u_frgb;
uniform float u_time;

vec2 f(vec2 x, vec2 c) {
  return mat2(x, -x.y, x.x) * x + c;
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

  if (l > float(u_maxIterations)) {
    return 0.0;
  }

  float sl = l - log2(log2(dot(z, z))) + 0.0;
  l = mix(l, sl, 1.0);

  return l;
}

void main() {
  const int AA = 2;
  vec3 color = vec3(0.0);

  for (int m = 0; m < AA; m++) {
    for (int n = 0; n < AA; n++) {
      vec2 uv = gl_FragCoord.xy / (u_resolution);
      float w = float(AA * m + n);
      float time = u_time + 0.5 * (1.0 / 24.0) * w / float(AA * AA);
      vec2 c = u_zoomCenter + (uv * 4.0 - vec2(2.0)) * (u_zoomSize / 4.0);
      float l = mandelbrot(c);

      // float t = sin(time * 0.5 + uv.y * 10.0) + 0.5;
      float t = 1.;
      color += 0.4 + 0.6 * cos(3.0 + l * 0.15 + u_frgb);
    }
  }

  color /= float(AA*AA);

  gl_FragColor = vec4(color, 1.0);
}