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
        if (!vertexShader) {
            return;
        }
        const fragmentShader = loadShader(this.gl, this.gl.FRAGMENT_SHADER, fsSource);
        if (!fragmentShader) {
            return;
        }

        // Create the shader program

        this.gl.attachShader(this.id, vertexShader);
        this.gl.attachShader(this.id, fragmentShader);
        this.gl.linkProgram(this.id);

        // If creating the shader program failed, alert
        if (!this.gl.getProgramParameter(this.id, this.gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(this.id));
            return false;
        }

        this.uniformLocations = {
        }

        return true;
    }

    enable() {
        this.gl.useProgram(this.id);
    }

    set_mat4(key, m) {
        let loc = this.uniformLocations[key];
        if (!loc) {
            loc = this.gl.getUniformLocation(this.id, key);
            this.uniformLocations[key] = loc;
        }
        this.enable();
        this.gl.uniformMatrix4fv(
            loc,
            false,
            m.values);
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

    add_buffer(topology, vertex_count, ...vbo_list) {
        this.topology = topology;
        this.vertex_count = vertex_count;

        this.enable();
        for (const vbo of vbo_list) {
            const loc = this.buffers.length;
            this.buffers.push(vbo);
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
        }
        this.disable();
    }

    draw() {
        this.enable();
        this.gl.drawArrays(this.topology, 0, this.vertex_count);
        this.disable();
    }
}

class Camera {
    constructor() {
        // projection
        this.fieldOfView = 45 * Math.PI / 180;   // in radians
        this.aspect = 1.0;
        this.zNear = 0.1;
        this.zFar = 100.0;

        // position
        this.distance = 6;

        this.recalculate();
    }

    recalculate() {
        this.projection = Matrix4.perspective({
            fovYRadian: this.fieldOfView,
            aspectRatio: this.aspect,
            near: this.zNear,
            far: this.zFar
        });

        this.view = Matrix4.identity()
            .translate(0, 0, -this.distance);
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

        this.vao = new VAO(this.gl);

        {
            const vbo_positions = new VBO(this.gl);
            const positions = [
                -1.0, 1.0,
                1.0, 1.0,
                -1.0, -1.0,
                1.0, -1.0,
            ];
            vbo_positions.data(positions, this.gl.FLOAT, 2);

            const vbo_colors = new VBO(this.gl);
            const colors = [
                1.0, 1.0, 1.0, 1.0,    // white
                1.0, 0.0, 0.0, 1.0,    // red
                0.0, 1.0, 0.0, 1.0,    // green
                0.0, 0.0, 1.0, 1.0,    // blue            
            ];
            vbo_colors.data(colors, this.gl.FLOAT, 4);

            this.vao.add_buffer(this.gl.TRIANGLE_STRIP, positions.length / 2, vbo_positions, vbo_colors);
        }

        this.camera = new Camera();
        this.camera.aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
        this.camera.recalculate();
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
        this.shader.set_mat4('uProjectionMatrix', this.camera.projection);
        this.shader.set_mat4('uModelViewMatrix', this.camera.view);
        this.vao.draw();
    }

    frame() {
        this.update(Date.now());
        this.render();
        requestAnimationFrame(() => { this.frame(); });
    }
}
