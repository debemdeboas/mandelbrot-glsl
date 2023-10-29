`precision highp float;
attribute vec2 a_Position;
void main() {
  gl_Position = vec4(a_Position.x, a_Position.y, 0.0, 1.0);
}``
precision highp float;

uniform vec2 u_zoomCenter;
uniform float u_zoomSize;
uniform int u_maxIterations;

vec2 f(vec2 x, vec2 c) {
    return mat2(x,-x.y,x.x)*x + c;
}
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b*cos( 6.28318*(c*t+d) );
}
void main() {
    vec2 uv = gl_FragCoord.xy / vec2(800.0, 800.0);
    vec2 c = u_zoomCenter + (uv * 4.0 - vec2(2.0)) * (u_zoomSize / 4.0);
    vec2 x = vec2(0.0);
    bool escaped = false;
    int iterations = 0;    
    for (int i = 0; i < 10000; i++) {
    if (i > u_maxIterations) break;
    iterations = i;
    x = f(x, c);
    if (length(x) > 2.0) {
        escaped = true;
        break;
    }
    }
    gl_FragColor = escaped ? vec4(palette(float(iterations)/float(u_maxIterations), vec3(0.0),vec3(0.59,0.55,0.75),vec3(0.1, 0.2, 0.3),vec3(0.75)),1.0) : vec4(vec3(0.85, 0.99, 1.0), 1.0);
}`;

function main() {
    /* locate the canvas element */
    let canvas_element = document.getElementById("maincanvas");

    /* obtain a webgl rendering context */
    let gl = canvas_element.getContext("webgl");

    /* get shader code from the <script> tags */
    let vertex_shader_src = document.getElementById("shader-vs").text;
    let fragment_shader_src = document.getElementById("shader-fs").text;

    /* compile and link shaders */
    let vertex_shader = gl.createShader(gl.VERTEX_SHADER);
    let fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vertex_shader, vertex_shader_src);
    gl.shaderSource(fragment_shader, fragment_shader_src);
    gl.compileShader(vertex_shader);
    console.log(gl.getShaderInfoLog(vertex_shader));
    gl.compileShader(fragment_shader);
    console.log(gl.getShaderInfoLog(fragment_shader));
    let mandelbrot_program = gl.createProgram();
    gl.attachShader(mandelbrot_program, vertex_shader);
    gl.attachShader(mandelbrot_program, fragment_shader);
    gl.linkProgram(mandelbrot_program);
    gl.useProgram(mandelbrot_program);

    /* create a vertex buffer for a full-screen triangle */
    let vertex_buf = gl.createBuffer(gl.ARRAY_BUFFER);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    /* set up the position attribute */
    let position_attrib_location = gl.getAttribLocation(mandelbrot_program, "a_Position");
    gl.enableVertexAttribArray(position_attrib_location);
    gl.vertexAttribPointer(position_attrib_location, 2, gl.FLOAT, false, 0, 0);

    /* find uniform locations */
    let zoom_center_uniform = gl.getUniformLocation(mandelbrot_program, "u_zoomCenter");
    let zoom_size_uniform = gl.getUniformLocation(mandelbrot_program, "u_zoomSize");
    let max_iterations_uniform = gl.getUniformLocation(mandelbrot_program, "u_maxIterations");

    /* these hold the state of zoom operation */
    let zoom_center = [0.0, 0.0];
    let target_zoom_center = [0.0, 0.0];
    let zoom_size = 4.0;
    let stop_zooming = true;
    let zoom_factor = 1.0;
    let max_iterations = 500;

    let renderFrame = function () {
        /* bind inputs & render frame */
        gl.uniform2f(zoom_center_uniform, zoom_center[0], zoom_center[1]);
        gl.uniform1f(zoom_size_uniform, zoom_size);
        gl.uniform1i(max_iterations_uniform, max_iterations);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        /* handle zoom */
        if (!stop_zooming) {
            /* zooming in progress */
            /* gradually decrease number of iterations, reducing detail, to speed up rendering */
            max_iterations -= 10;
            if (max_iterations < 50) max_iterations = 50;

            /* zoom in */
            zoom_size *= zoom_factor;

            /* move zoom center towards target */
            zoom_center[0] += 0.1 * (target_zoom_center[0] - zoom_center[0]);
            zoom_center[1] += 0.1 * (target_zoom_center[1] - zoom_center[1]);

            window.requestAnimationFrame(renderFrame);
        } else if (max_iterations < 500) {
            /* once zoom operation is complete, bounce back to normal detail level */
            max_iterations += 10;
            window.requestAnimationFrame(renderFrame);
        }
    };

    /* input handling */
    canvas_element.onmousedown = function (e) {
        let x_part = e.offsetX / canvas_element.width;
        let y_part = e.offsetY / canvas_element.height;
        target_zoom_center[0] = zoom_center[0] - zoom_size / 2.0 + x_part * zoom_size;
        target_zoom_center[1] = zoom_center[1] + zoom_size / 2.0 - y_part * zoom_size;
        stop_zooming = false;
        zoom_factor = e.buttons & 1 ? 0.99 : 1.01;
        renderFrame();
        return true;
    };
    canvas_element.oncontextmenu = function (e) {
        return false;
    };
    canvas_element.onmouseup = function (e) {
        stop_zooming = true;
    };

    /* display initial frame */
    renderFrame();
}
