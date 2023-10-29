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

    const u_zoomCenter = gl.getUniformLocation(shaderProgram, "u_zoomCenter");
    const u_zoomSize = gl.getUniformLocation(shaderProgram, "u_zoomSize");
    const u_resolution = gl.getUniformLocation(shaderProgram, "u_resolution");
    const u_maxIterations = gl.getUniformLocation(shaderProgram, "u_maxIterations");

    gl.uniform2f(u_zoomCenter, 0.0, 0.0);
    gl.uniform1f(u_zoomSize, 2.0);
    gl.uniform2f(u_resolution, canvas.width, canvas.height);
    gl.uniform1i(u_maxIterations, 10000);

    // Draw
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // clear to black
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 3);

    function animate(time) {
        time *= 0.001; // convert time to seconds

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        //Draw loop
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // zoomSize -= zoomSpeed * deltaTime * zoomDirection;

        gl.useProgram(shaderProgram);
        const u_zoomCenter = gl.getUniformLocation(shaderProgram, "u_zoomCenter");
        const u_zoomSize = gl.getUniformLocation(shaderProgram, "u_zoomSize");
        const u_time = gl.getUniformLocation(shaderProgram, "u_time");
        gl.uniform2f(u_zoomCenter, zoomCenterX, zoomCenterY);
        gl.uniform1f(u_zoomSize, zoomSize);
        gl.uniform1f(u_time, time);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 3);

        window.requestAnimationFrame(animate);
    }

    animate(0);

    return shaderProgram;
}

function _fragmentGLSL() {
    return `
  precision highp float;
  
  uniform vec2 u_zoomCenter;
  uniform float u_zoomSize;
  uniform vec2 u_resolution;
  uniform int u_maxIterations;
  uniform float u_time;

  vec2 transformFragCoordinates(vec2 coords) {
    vec2 halfScreen = u_resolution / 2.0;
    vec2 uv = coords;
    uv = (uv - halfScreen) * u_zoomSize + halfScreen; // zoom from screen center
    uv += u_zoomCenter; // move zoom center
    uv /= u_resolution; // screen to [0, 1]
    uv = uv * 2.0 - 1.0; // [0, 1] to [-1, 1]
    return uv;
  }

  vec3 computeColor(bool unbounded, int iterations, vec2 z) {
    float normalizedIterations = float(iterations) / float(u_maxIterations) * 100.0 * log2(u_zoomSize * 10.0);
    return unbounded
      ? 0.5 * vec3(sin(normalizedIterations)) + vec3(0.0, 0.0, 1.0) * 0.5 * cos((float(length(z)) - 2.0) / 4.0)
      : vec3(0.0);
  }

  float mandelbrot(vec2 c) {
    float c2 = dot(c, c);
    if ((256.0 * c2 * c2 - 96.0 * c2 + 32.0 * c.x - 3.0 < 0.0) || (16.0 * (c2 + 2.0 * c.x + 1.0) - 1.0 < 0.0)) {
      return 0.0;
    }

    const float B = 256.0;
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

    float sl = l - log2(log2(dot(z, z))) + 4.0;

    float al = smoothstep(-0.1, 0.0, sin(0.5 * 6.2831 * u_time));
    l = mix(l, sl, al);

    return l;
  }

  vec4 main_mandelbrot() {
    const int AA = 2;

    vec3 col = vec3(0.0);

    for (int m=0; m<AA; m++) {
      for (int n=0; n<AA; n++) {
          vec2 p = (-u_resolution.xy + 2.0 * (gl_FragCoord.xy + vec2(float(m), float(n)) / float(AA))) / u_resolution.y;
          float w = float(AA * m + n);
          float time = u_time + 0.5 * (1.0 / 24.0) * w / float(AA * AA);

          float zoo = 0.62 + 0.38 * cos(.07 * time);
          float coa = cos(0.15 * (1.0 - zoo) * time);
          float sia = sin(0.15 * (1.0 - zoo) * time);

          zoo = pow(zoo, 8.0);
          vec2 xy = vec2(p.x * coa - p.y * sia, p.x * sia + p.y * coa);
          vec2 c = vec2(-.745, .186) + xy * zoo;

          float l = mandelbrot(c);

          col += 0.5 + 0.5 * cos(3.0 + l * 0.15 + vec3(0.0, 0.6, 1.0));
      }
    }
    col /= float(AA * AA);

    return vec4(col, 1.0);
  }

  void main(void) {
    gl_FragColor = main_mandelbrot();
    return;

    // mandelbrot setup
    vec2 c = transformFragCoordinates(gl_FragCoord.xy);
    vec2 z = vec2(0.0);
    bool unbounded = false;
    int iterations = 0;
    vec3 col = vec3(0.0);
  
    // mandelbrot loop
    for (int i = 0; i < 100000; i++) {
      // mandelbrot exit (condition that will stay true)
      if (unbounded || i > u_maxIterations) break;
      // mandelbrot iteration

      float c2 = dot(c, c);
      if (256.0 * c2 * c2 - 96.0 * c2 + 32.0 * c.x - 3.0 < 0.0) {
        unbounded = true;
        break;
      }

      if (16.0 * (c2 + 2.0 * c.x + 1.0) - 1.0 < 0.0) {
        unbounded = true;
        break;
      }

      z = vec2(pow(abs(z.x), 2.0) - pow(abs(z.y), 2.0), 2.0 * z.x * z.y) + c;
      iterations = i;

      float l = float(i);
      float sl = l - log2(log2(dot(z, z))) + 5.0;
      float al = smoothstep(-.1, 0.0, sin(0.5*6.28));

      l = mix(l, sl, al);

      // mandelbrot exit (condition that will never been reached again)
      if (length(z) > 2.0) {
        unbounded = true;
        break;
      }

      col += 0.5 + 0.5 * cos(3.0 + l * 0.15 + vec3(0.0, 0.6, 1.0));
    }

    // frament color
    // gl_FragColor = vec4(computeColor(unbounded, iterations, z), 1.0);
    gl_FragColor = vec4(computeColor(unbounded, iterations, z), 1.0);
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
