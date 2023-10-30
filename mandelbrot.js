function readTextFile(filepath) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", filepath, false);
    xhr.send();
    return xhr.responseText;
}

function fragmentGLSL() {
    return readTextFile("shaders/mandelbrot.fs");
}

function vertexGLSL() {
    return readTextFile("shaders/mandelbrot.vs");
}

function hashString(string) {
    let hash = 0;
    if (string.length === 0) return hash;
    for (let i = 0; i < string.length; i++) {
        hash = (hash << 5) - hash + string.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}

function scaleNum(num, op = Math.sin) {
    let res = op(num) * 100;
    if (res < 0) {
        res += 1;
    }
    return Math.trunc(res) / 100;
}

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
}

function main() {
    window.mobileCheck = function () {
        let check = false;
        (function (a) {
            if (
                /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
                    a
                ) ||
                /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
                    a.substr(0, 4)
                )
            )
                check = true;
        })(navigator.userAgent || navigator.vendor || window.opera);
        return check;
    };

    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get("name", "ron swanson");
    const bday = urlParams.get("birthdate", "42-42-42");

    let canvas_element = document.getElementById("glcanvas");
    let gl = canvas_element.getContext("webgl2");
    let vertex_shader_src = vertexGLSL();
    let fragment_shader_src = fragmentGLSL();

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

    /* get uniform locations */
    let u_resolution = gl.getUniformLocation(mandelbrot_program, "u_resolution");
    let u_zoom_center = gl.getUniformLocation(mandelbrot_program, "u_zoomCenter");
    let u_zoom_size = gl.getUniformLocation(mandelbrot_program, "u_zoomSize");
    let u_max_iterations = gl.getUniformLocation(mandelbrot_program, "u_maxIterations");
    let u_frgb = gl.getUniformLocation(mandelbrot_program, "u_frgb");
    let u_time = gl.getUniformLocation(mandelbrot_program, "u_time");
    let want_to_print = false;

    const MAX_ITER = window.mobileCheck() ? 120 : 400;

    // zooming
    let zoom_center = [0.0, 0.0];
    let target_zoom_center = [0.0, 0.0];
    let zoom_size = 3.0;
    let stop_zooming = true;
    let zoom_factor = 1.0;

    let max_iterations = MAX_ITER;
    let colors = [
        scaleNum(hashString(username)),
        scaleNum(hashString(bday)),
        scaleNum(hashString(username) * hashString(bday), Math.cos),
    ];

    let renderFrame = function (time) {
        time /= 100;

        /* bind inputs & render frame */
        gl.uniform2f(u_resolution, canvas_element.width, canvas_element.height);
        gl.uniform2f(u_zoom_center, zoom_center[0], zoom_center[1]);
        gl.uniform1f(u_zoom_size, zoom_size);
        gl.uniform1i(u_max_iterations, max_iterations);
        gl.uniform3f(u_frgb, colors[0], colors[1], colors[2]);
        gl.uniform1f(u_time, time);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        /* print screen */
        if (want_to_print) {
            want_to_print = false;
            let a = document.createElement("a");
            a.href = canvas_element.toDataURL("image/png", 1.0).replace("image/png", "image/octet-stream");
            a.download = `mandelbrot-${username}.png`;
            a.click();
        }

        /* handle zoom */
        if (!stop_zooming) {
            /* zooming in progress */
            /* gradually decrease number of iterations, reducing detail, to speed up rendering */
            max_iterations -= 10;
            if (max_iterations < Math.trunc(MAX_ITER / 3)) {
                max_iterations = Math.trunc(MAX_ITER / 3);
            }

            /* zoom in */
            zoom_size *= zoom_factor;

            /* move zoom center towards target */
            zoom_center[0] += 0.1 * (target_zoom_center[0] - zoom_center[0]);
            zoom_center[1] += 0.1 * (target_zoom_center[1] - zoom_center[1]);

            window.requestAnimationFrame(renderFrame);
        } else {
            max_iterations = MAX_ITER;
            window.requestAnimationFrame(renderFrame);
        }
    };

    const handleInput = function (e) {
        e.preventDefault();

        let x_part, y_part;
        if (e.type === "mousedown") {
            x_part = e.offsetX / window.innerWidth;
            y_part = e.offsetY / window.innerHeight;
            zoom_factor = e.buttons & 1 ? 0.99 : 1.01;
        } else if (e.type === "touchstart") {
            let touch = e.touches[0];
            x_part = touch.clientX / window.innerWidth;
            y_part = touch.clientY / window.innerHeight;
            zoom_factor = e.touches.length === 1 ? 0.99 : 1.01;
        } else if (e.type === "touchend" || e.type === "touchcancel") {
            stop_zooming = true;
            renderFrame();
            return true;
        }

        target_zoom_center[0] = zoom_center[0] - zoom_size / 2.0 + x_part * zoom_size;
        target_zoom_center[1] = zoom_center[1] + zoom_size / 2.0 - y_part * zoom_size;
        stop_zooming = false;
        renderFrame();
        return true;
    };

    /* input handling */
    canvas_element.onmousedown = handleInput;
    canvas_element.ontouchstart = handleInput;
    canvas_element.ontouchend = handleInput;
    canvas_element.ontouchcancel = handleInput;

    canvas_element.oncontextmenu = function (e) {
        return false;
    };

    canvas_element.onmouseup = function (e) {
        stop_zooming = true;
    };

    window.onkeydown = function (e) {
        if (e.key === "p" || e.key === "P") {
            want_to_print = true;
        }
    };

    /* display initial frame */
    renderFrame();
}

main();
