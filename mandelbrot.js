function readTextFile(filepath) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", filepath, false);
    xhr.send();
    return xhr.responseText;
}

function _fragmentGLSL() {
    return readTextFile("shaders/mandelbrot.fs");
    // return readTextFile("shaders/mandelbrot.fs");
}

function _vertexGLSL() {
    return readTextFile("shaders/mandelbrot.vs");
    // return readTextFile("shaders/mandelbrot.vs");
}

function main() {
    /* locate the canvas element */
    let canvas_element = document.getElementById("glcanvas");

    /* obtain a webgl rendering context */
    let gl = canvas_element.getContext("webgl2");

    /* get shader code from the <script> tags */
    let vertex_shader_src = _vertexGLSL();
    let fragment_shader_src = _fragmentGLSL();

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
    const coord = gl.getAttribLocation(mandelbrot_program, "coordinates");
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buf);
    gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coord);

    /* find uniform locations */
    let resolution_uniform = gl.getUniformLocation(mandelbrot_program, "u_resolution");
    let zoom_center_uniform = gl.getUniformLocation(mandelbrot_program, "u_zoomCenter");
    let zoom_size_uniform = gl.getUniformLocation(mandelbrot_program, "u_zoomSize");
    let max_iterations_uniform = gl.getUniformLocation(mandelbrot_program, "u_maxIterations");

    /* these hold the state of zoom operation */
    let zoom_center = [0.0, 0.0];
    let target_zoom_center = [0.0, 0.0];
    let zoom_size = 4.0;
    let stop_zooming = true;
    let zoom_factor = 1.0;
    let max_iterations = 1500;

    let renderFrame = function () {
        /* bind inputs & render frame */
        gl.uniform2f(resolution_uniform, canvas_element.width, canvas_element.height);
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
            if (max_iterations < 100) max_iterations = 100;

            /* zoom in */
            zoom_size *= zoom_factor;

            /* move zoom center towards target */
            zoom_center[0] += 0.1 * (target_zoom_center[0] - zoom_center[0]);
            zoom_center[1] += 0.1 * (target_zoom_center[1] - zoom_center[1]);

            window.requestAnimationFrame(renderFrame);
        } else if (max_iterations < 100) {
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

main();
