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

let zoomCenterX = 10;
let zoomCenterY = 4;
let zoomSize = 1.0;
let zoomDirection = 1;
let zoomSpeed = 0.01;

let isDown = false; // whether mouse is pressed
let startCoords = new Vec2(); // 'grab' coordinates when pressing mouse
let last = new Vec2(); // previous coordinates of mouse release

const canvas = document.getElementById("glcanvas");

function handleWheel(event) {
    const delta = event.deltaY > 0 ? 1 : -1;
    const zoomSpeed = 0.01;
    zoomSize += delta * zoomSpeed;
    event.preventDefault();
}

function main() {
    function resizeCanvas() {
        const aspectRatio = 4 / 3;
        const width = window.innerWidth;
        const height = window.innerHeight;
        const canvasWidth = height * aspectRatio;
        const canvasHeight = width / aspectRatio;
        if (canvasWidth <= width) {
            canvas.style.width = canvasWidth;
            canvas.style.height = height;
        } else {
            canvas.style.width = width;
            canvas.style.height = canvasHeight;
        }
    }

    window.addEventListener("resize", resizeCanvas);
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
        if (!isDown) return;

        // update zoom center
        zoomCenterX = (e.pageX - startCoords.x) / zoomSize;
        zoomCenterY = (e.pageY - startCoords.y) / zoomSize;
    };

    // Initialize the GL context
    let gl = canvas.getContext("webgl");

    // Only continue if WebGL is available and working
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    getShader(canvas, gl, _vertexGLSL(), _fragmentGLSL());
}

function getTimeInSeconds() {
    return Date.now() * 0.001;
}

function getShader(canvas, gl, vertexShaderSource, fragmentShaderSource) {
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

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

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

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram); // link both shaders to the shader program
    gl.useProgram(shaderProgram);

    const coord = gl.getAttribLocation(shaderProgram, "coordinates");
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coord);

    const center_x = gl.getUniformLocation(shaderProgram, "center_x");
    const center_y = gl.getUniformLocation(shaderProgram, "center_y");
    const zoom = gl.getUniformLocation(shaderProgram, "zoom");
    const color_ranges = gl.getUniformLocation(shaderProgram, "color_ranges");

    gl.uniform1f(center_x, zoomCenterX);
    gl.uniform1f(center_y, zoomCenterY);
    gl.uniform1f(zoom, zoomSize);
    gl.uniform4f(color_ranges, 0.1, 0.333, 0.666, 1.0);

    // Draw
    gl.clearColor(0.2, 0.0, 0.2, 1.0); // clear to black-ish
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 3);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    function animate(time) {
        //Draw loop
        gl.clearColor(0.2, 0.0, 0.2, 1.0); // clear to black-ish
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(shaderProgram);
        const u_center = gl.getUniformLocation(shaderProgram, "u_center");
        gl.uniform2f(u_center, zoomCenterX, zoomCenterY);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 3);

        window.requestAnimationFrame(animate);
    }

    //   animate(0);

    return shaderProgram;
}

function _fragmentGLSL() {
    return `
    precision highp float;

    uniform float center_x;
    uniform float center_y;
    uniform float zoom;
    uniform vec4 color_ranges;
    
    int get_iterations()
    {
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
    
    vec4 return_color()
    {
        int iter = get_iterations();
        if (iter == 600)
        {
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
    
    void main()
    {
        gl_FragColor = return_color();
    }
    `;
}

function _vertexGLSL() {
    return `
    attribute vec3 coordinates;
    
    void main(void) {
      gl_Position = vec4(coordinates, 1.0);
    }
    `;
}

main();
