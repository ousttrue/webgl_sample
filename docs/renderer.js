function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}
class Shader {
    constructor(gl) {
        this.gl = gl;
        this.id = gl.createProgram();
    }

    compile(vsSource, fsSource) {
        const vertexShader = loadShader(this.gl, this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = loadShader(this.gl, this.gl.FRAGMENT_SHADER, fsSource);

        // Create the shader program

        this.gl.attachShader(this.id, vertexShader);
        this.gl.attachShader(this.id, fragmentShader);
        this.gl.linkProgram(this.id);

        // If creating the shader program failed, alert
        if (!this.gl.getProgramParameter(this.id, this.gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(this.id));
            return false;
        }

        return true;
    }

    enable() {
        this.gl.useProgram(this.id);
    }
}

class VBO {
    constructor(gl) {
        this.gl = gl;
        this.id = gl.createBuffer();
    }

    enable() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.id);
    }

    disable() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }

    data(values, type, elements) {
        this.type = type;
        this.elements = elements;
        this.normalize = false;  // don't normalize
        this.stride = 0;         // how many bytes to get from one set of values to the next
        this.enable();
        this.gl.bufferData(this.gl.ARRAY_BUFFER,
            new Float32Array(values),
            this.gl.STATIC_DRAW);
    }
}

class VAO {
    constructor(gl) {
        this.gl = gl;
        this.ext = gl.getExtension("OES_vertex_array_object");
        this.id = this.ext.createVertexArrayOES();
        this.buffers = [];
    }

    enable() {
        this.ext.bindVertexArrayOES(this.id);
    }

    disable() {
        this.ext.bindVertexArrayOES(null);
    }

    add_buffer(vertex_count, vbo) {
        this.vertex_count = vertex_count;
        const loc = this.buffers.length;
        this.buffers.push(vbo);

        this.enable();
        vbo.enable();
        this.gl.vertexAttribPointer(
            loc,
            vbo.elements,
            vbo.type,
            vbo.normalize,
            vbo.stride,
            0);
        this.gl.enableVertexAttribArray(
            loc);
        vbo.disable();
        this.disable();
    }

    draw() {
        this.enable();
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertex_count);
        this.disable();
    }
}

class Renderer {

    constructor(canvas_id) {
        const canvas = document.querySelector(canvas_id);
        //this.gl = canvas.getContext("webgl2");
        this.gl = canvas.getContext("webgl");
        if (this.gl === null) {
            alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        }
    }

    initialize_scene(vs, fs) {
        this.shader = new Shader(this.gl);
        this.shader.compile(vs, fs);

        const vbo = new VBO(this.gl);
        const positions = [
            0, 0.8,
            -0.8, -0.8,
            0.8, -0.8
        ];
        vbo.data(positions, this.gl.FLOAT, 2);

        this.vao = new VAO(this.gl);
        this.vao.add_buffer(3, vbo);
    }

    // animation
    update(time_ms) {
        const angle = time_ms * 0.001 * Math.PI;
        this.bg = Math.sin(angle) + 1;
        this.clear_color = [this.bg, this.bg, this.bg, 1];
    }

    // draw
    render() {
        this.gl.clearColor(...this.clear_color);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.shader.enable();
        this.vao.draw();
    }

    frame() {
        this.update(Date.now());
        this.render();
        requestAnimationFrame(() => { this.frame(); });
    }
}
