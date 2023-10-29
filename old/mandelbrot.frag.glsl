precision highp float;

uniform float center_x;
uniform float center_y;
uniform float zoom;
uniform vec4 color_ranges;

int get_iterations() {
    float real = ((gl_FragCoord.x / 1080.0 - 0.5) * zoom + center_x) * 4.0;
    float imag = ((gl_FragCoord.y / 1080.0 - 0.5) * zoom + center_y) * 4.0;

    int iterations = 0;
    float const_real = real;
    float const_imag = imag;

    for (int iterations = 0; iterations < 600; ++iterations) {
        float tmp_real = real;
        real = (real * real - imag * imag) + const_real;
        imag = (2.0 * tmp_real * imag) + const_imag;

        float dist = real * real + imag * imag;

        if (dist > 4.0)
            break;
    }
    return iterations;
}

vec4 return_color() {
    int iter = get_iterations();
    if (iter == 600) {
        float fragDepth = 0.0;
        return vec4(0.0, 0.0, 0.0, 1.0);
    }

    float iterations = float(iter) / 600.0;
    float fragDepth = iterations;

    vec4 color_0 = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 color_1 = vec4(0.0, 0.2, 0.5, 1.0);
    vec4 color_2 = vec4(1.0, 0.8, 0.0, 1.0);
    vec4 color_3 = vec4(1.0, 0.0, 0.4, 1.0);

    float fraction = 0.0;
    if (iterations < color_ranges[1]) {
        fraction = (iterations - color_ranges[0]) / (color_ranges[1] - color_ranges[0]);
        return mix(color_0, color_1, fraction);
    } else if (iterations < color_ranges[2]) {
        fraction = (iterations - color_ranges[1]) / (color_ranges[2] - color_ranges[1]);
        return mix(color_1, color_2, fraction);
    } else {
        fraction = (iterations - color_ranges[2]) / (color_ranges[3] - color_ranges[2]);
        return mix(color_2, color_3, fraction);
    }
}

void main() {
    gl_FragColor = return_color();
}