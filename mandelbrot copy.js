class Vec2 {
    constructor(x = 0.0, y = 0.0) {
        this.x = x;
        this.y = y;
    }
    add(other) {
        return new Vec2(this.x + other.x, this.y + other.y);
    }
    sub(other) {
        return new Vec2(this.x - other.x, this.y - other.y);
    }
    mul(other) {
        return new Vec2(this.x * other, this.y * other);
    }
    div(other) {
        return new Vec2(this.x / other, this.y / other);
    }
}

let zoomCenterX = 0;
let zoomCenterY = 300;
let zoomSize = 1.0;
let zoomAmount = 1;
let zoomSpeed = 0.01;

let shaderProgram;

let isDown = false; // whether mouse is pressed
let startCoords = new Vec2(); // 'grab' coordinates when pressing mouse
let last = new Vec2(); // previous coordinates of mouse release
let mouse = new Vec2(); // current coordinates of mouse
let isPaused = false;
let currTime = 0;
let panDirection = 0;
let colors = [];

const canvas = document.getElementById("glcanvas");
const vertices = [
    -1,
    1,
    0.0, // top left
    -1,
    -1,
    0.0, // bottom left
    1,
    -1,
    0.0, // bottom right
    1,
    1,
    1, // top right
];

canvas.addEventListener("wheel", handleWheel);

canvas.onmousedown = function (e) {
    isDown = true;
    startCoords.x = e.pageX - last.x;
    startCoords.y = e.pageY - last.y;
};

canvas.onmouseup = function (e) {
    isDown = false;
    last.x = e.pageX - startCoords.x;
    last.y = e.pageY - startCoords.y;
};

canvas.onmousemove = function (e) {
    mouse.x = e.pageX;
    mouse.y = e.pageY;

    if (!isDown) return;

    // update zoom center
    zoomCenterX = (e.pageX - startCoords.x) / zoomSize;
    zoomCenterY = (e.pageY - startCoords.y) / zoomSize;
};

window.addEventListener("keydown", (event) => {
    if (event.key === " ") {
        isPaused = !isPaused;
        console.log(isPaused, currTime);
    } else if (event.key === "e" || event.key === "E") {
        panDirection += 1;
    } else if (event.key == "q" || event.key === "Q") {
        panDirection -= 1;
    } else {
        return;
    }
    if (!isPaused) {
        animateShader(currTime);
    }
});

function handleWheel(event) {
    event.preventDefault();

    if (event.deltaY < 0) {
        zoomAmount -= 0.5;
    } else {
        zoomAmount += 0.5;
    }
}

const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get("name", "john snow");
const bday = urlParams.get("birthdate", "123 123 123");

function resizeCanvasToDisplaySize(canvas) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    // Check if the canvas is not the same size.
    const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;

    if (needResize) {
        // Make the canvas the same size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    return needResize;
}

function getShader(gl, vertexShaderSource, fragmentShaderSource, colors) {
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    /// Create shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    // Check if shader compiled successfully
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(vertexShader));
        return null;
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // Check if shader compiled successfully
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(fragmentShader));
        return null;
    }

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram); // link both shaders to the shader program

    gl.useProgram(shaderProgram);

    // Bind vertex buffer object
    const coord = gl.getAttribLocation(shaderProgram, "coordinates");
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coord);

    // Draw
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // clear to black
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    animateShader(0);

    return shaderProgram;
}

function main() {
    // Initialize the GL context
    let gl = canvas.getContext("webgl2");

    // Only continue if WebGL is available and working
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    colors = [
        scaleNum(hashString(username)),
        scaleNum(hashString(bday)),
        scaleNum(hashString(username) * hashString(bday)),
    ];

    console.log(colors);

    getShader(gl, _vertexGLSL(), _fragmentGLSL(), colors);
}

/* these hold the state of zoom operation */
let zoom_center = [0.0, 0.0];
let target_zoom_center = [0.0, 0.0];
let zoom_size = 4.0;
let stop_zooming = true;
let zoom_factor = 1.0;
let max_iterations = 500;

function animateShader(time) {
    let gl = canvas.getContext("webgl2");
    let zoom_center_uniform = gl.getUniformLocation(shaderProgram, "u_zoomCenter");
    let zoom_size_uniform = gl.getUniformLocation(shaderProgram, "u_zoomSize");
    let max_iterations_uniform = gl.getUniformLocation(shaderProgram, "u_maxIterations");

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
}

function animateShader_2(time) {
    let gl = canvas.getContext("webgl2");
    resizeCanvasToDisplaySize(canvas);

    time *= 0.001; // convert time to seconds
    currTime = time;

    gl.viewport(0, 0, canvas.width, canvas.height);

    //Draw loop
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shaderProgram);
    const u_zoomSize = gl.getUniformLocation(shaderProgram, "u_zoomSize");
    const u_time = gl.getUniformLocation(shaderProgram, "u_time");
    const u_frgb = gl.getUniformLocation(shaderProgram, "u_frgb");
    const u_pan = gl.getUniformLocation(shaderProgram, "u_pan");
    const u_zoomAmount = gl.getUniformLocation(shaderProgram, "u_zoomAmount");
    const u_mouse = gl.getUniformLocation(shaderProgram, "u_mouse");
    const u_zoomSpeed = gl.getUniformLocation(shaderProgram, "u_zoomSpeed");
    const u_resolution = gl.getUniformLocation(shaderProgram, "u_resolution");
    const u_animate = gl.getUniformLocation(shaderProgram, "u_animate");
    const u_zoomCenter = gl.getUniformLocation(shaderProgram, "u_zoomCenter");

    gl.uniform2f(u_resolution, canvas.width, canvas.height);
    gl.uniform1i(u_animate, false);
    gl.uniform3f(u_frgb, colors[0], colors[1], colors[2]);
    gl.uniform1f(u_zoomSize, 0.1);
    gl.uniform1f(u_time, time);
    gl.uniform3f(u_frgb, colors[0], colors[1], colors[2]);
    gl.uniform1i(u_pan, panDirection);
    gl.uniform1f(u_zoomAmount, zoomAmount);
    gl.uniform2f(u_mouse, mouse.x, mouse.y);
    gl.uniform1f(u_zoomSpeed, zoomSpeed);
    gl.uniform2f(u_zoomCenter, 0.0, 0.0);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 3);

    if (!isPaused) {
        window.requestAnimationFrame(animateShader);
    }
}

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

function hashString(string) {
    let hash = 0,
        i;
    if (string.length === 0) return hash;
    for (i = 0; i < string.length; i++) {
        hash = (hash << 5) - hash + string.charCodeAt(i); // eslint-disable-line no-bitwise
        hash |= 0; // eslint-disable-line no-bitwise
    }
    return hash;
}

function scaleNum(num) {
    let sin = Math.sin(num) * 100;

    if (sin < 0) {
        sin += 1;
    }

    return Math.trunc(sin) / 100;
}

main();
