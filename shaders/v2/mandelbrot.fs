precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_center;
uniform vec3 u_frgb;
uniform float u_time;
uniform bool u_animate;
uniform bool u_rotate; // whether to rotate the fractal
uniform int u_pan;
uniform float u_zoomAmount;
uniform vec2 u_mouse;
uniform float u_zoomSpeed;
uniform vec2 u_zoomCenter;

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

vec4 main_mandelbrot() {
    const int AA = 4;

    vec3 col = vec3(0.0);

    for (int m = 0; m < AA; m++) {
        for (int n = 0; n < AA; n++) {
            vec2 p = (-u_resolution.xy + u_center.xy + 2. * (gl_FragCoord.xy + vec2(float(m), float(n)) / float(AA))) / u_resolution.y;

            float w = float(AA * m + n);

            float time = u_time + 0.5 * (1.0 / 24.0) * w / float(AA * AA);

            float zoom = 0.8 * -time;
            if (u_animate) {
                zoom *= cos(.07 * time);
            }

            float coa = 1.0;
            float sia = 1.0;
            if(u_rotate) {
                coa = cos(0.15 * (1.0 - zoom) * time);
                sia = sin(0.15 * (1.0 - zoom) * time);
            }

            // p *= vec2(u_center);

            // zoom = pow(zoom, 1.1);
            zoom = pow(1.3, zoom);

            vec2 bulb_angle = vec2(
                p.x * cos(float(u_pan) / 10.) - p.y * sin(float(u_pan) / 10.),
                p.x * sin(float(u_pan) / 10.) + p.y * cos(float(u_pan) / 10.));

            vec2 c = bulb_angle * zoom;

            float l = mandelbrot(c);

            col += 0.4 + 0.5 * cos(3.0 + l * 0.15 + u_frgb);
            // col += float(e) * 0.5 + 0.5 * cos(3.0 + l * 0.15 + u_frgb);
        }
    }
    col /= float(AA * AA);

    return vec4(col, 1.0);
}

void main(void) {
    gl_FragColor = main_mandelbrot();
    // vec2 c = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    // float zoom = pow(1.1, u_time * 1.1);

    // vec2 mouse = vec2(
    //     (u_mouse.x / u_resolution.x) * 2. - 1.,
    //     (1. - u_mouse.y / u_resolution.y) * 2. - 1.);

    // mouse.x *= u_time;

    // c = mix(c * zoom, c + (mouse - 0.5) / zoom, 0.5);
    // c /= zoom;

    // float l = mandelbrot_classic(c);

    // vec3 col = vec3(0.0);
    // col += 0.4 + 0.5 * cos(3.0 + l * 0.15 + u_frgb);

    // gl_FragColor = vec4(col, 1.0);
}