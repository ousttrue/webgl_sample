//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, image) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        // Yes, it's a power of 2. Generate mips.
        gl.generateMipmap(gl.TEXTURE_2D);
    } else {
        // No, it's not a power of 2. Turn of mips and set
        // wrapping to clamp to edge
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    return texture;
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

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
    //
    // type: gl.ARRAY_BUFFER
    // type: gl.ELEMENT_ARRAY_BUFFER
    //
    constructor(gl, type) {
        this.gl = gl;
        this.id = gl.createBuffer();
        this.type = type;
    }

    enable() {
        this.gl.bindBuffer(this.type, this.id);
    }

    disable() {
        this.gl.bindBuffer(this.type, null);
    }

    indices(values) {
        if (this.type != this.gl.ELEMENT_ARRAY_BUFFER) {
            alert("not ELEMENT_ARRAY_BUFFER");
        }
        this.enable();
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(values),
            this.gl.STATIC_DRAW);
        this.vertex_count = values.length;
    }

    data(values, element_type, elements) {
        if (this.type != this.gl.ARRAY_BUFFER) {
            alert("not ARRAY_BUFFER");
        }
        this.element_type = element_type;
        this.elements = elements;
        this.normalize = false;  // don't normalize
        this.stride = 0;         // how many bytes to get from one set of values to the next
        this.enable();
        this.gl.bufferData(this.gl.ARRAY_BUFFER,
            new Float32Array(values),
            this.gl.STATIC_DRAW);
        this.vertex_count = values.length / elements;
    }
}

class VAO {
    constructor(gl) {
        this.gl = gl;
        this.ext = gl.getExtension("OES_vertex_array_object");
        this.id = this.ext.createVertexArrayOES();
        this.buffers = [];
        this.matrix = Matrix4.identity();
    }

    enable() {
        this.ext.bindVertexArrayOES(this.id);
    }

    disable() {
        this.ext.bindVertexArrayOES(null);
    }

    add_buffer(topology, indices, ...vbo_list) {
        this.topology = topology;
        this.indices = indices;

        this.enable();
        indices.enable();

        for (const vbo of vbo_list) {
            const loc = this.buffers.length;
            this.buffers.push(vbo);
            vbo.enable();
            this.gl.vertexAttribPointer(
                loc,
                vbo.elements,
                vbo.element_type,
                vbo.normalize,
                vbo.stride,
                0);
            this.gl.enableVertexAttribArray(
                loc);
            vbo.disable();
        }
        this.disable();
    }

    update(time_ms) {
        const angleX = time_ms * 0.0005 * Math.PI + 1;
        const angleZ = time_ms * 0.001 * Math.PI;
        this.matrix = Matrix4.identity()
            .rotateZ(angleZ)
            .rotateX(angleX)
            ;
    }

    draw() {
        this.enable();
        if (this.indices) {
            this.gl.drawElements(this.topology,
                this.indices.vertex_count,
                this.gl.UNSIGNED_SHORT,
                0);
        }
        else {
            this.gl.drawArrays(this.topology, 0, this.vertex_count);
        }
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

    initialize_scene(vs, fs, image) {

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.enable(this.gl.CULL_FACE);

        this.shader = new Shader(this.gl);
        this.shader.compile(vs, fs);

        this.vao = new VAO(this.gl);

        {
            const vbo_positions = new VBO(this.gl, this.gl.ARRAY_BUFFER);
            const positions = [
                // Front face
                -1.0, -1.0, 1.0,
                1.0, -1.0, 1.0,
                1.0, 1.0, 1.0,
                -1.0, 1.0, 1.0,

                // Back face
                -1.0, -1.0, -1.0,
                -1.0, 1.0, -1.0,
                1.0, 1.0, -1.0,
                1.0, -1.0, -1.0,

                // Top face
                -1.0, 1.0, -1.0,
                -1.0, 1.0, 1.0,
                1.0, 1.0, 1.0,
                1.0, 1.0, -1.0,

                // Bottom face
                -1.0, -1.0, -1.0,
                1.0, -1.0, -1.0,
                1.0, -1.0, 1.0,
                -1.0, -1.0, 1.0,

                // Right face
                1.0, -1.0, -1.0,
                1.0, 1.0, -1.0,
                1.0, 1.0, 1.0,
                1.0, -1.0, 1.0,

                // Left face
                -1.0, -1.0, -1.0,
                -1.0, -1.0, 1.0,
                -1.0, 1.0, 1.0,
                -1.0, 1.0, -1.0,
            ];
            const vertex_count = positions.length / 4;
            vbo_positions.data(positions, this.gl.FLOAT, 3);

            const vbo_uv = new VBO(this.gl, this.gl.ARRAY_BUFFER);
            const uv = [
                // Front
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
                // Back
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
                // Top
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
                // Bottom
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
                // Right
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
                // Left
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
            ];
            vbo_uv.data(uv, this.gl.FLOAT, 2);

            const vbo_colors = new VBO(this.gl, this.gl.ARRAY_BUFFER);
            const faceColors = [
                [0.0, 1.0, 1.0, 1.0],    // Front face: white
                [1.0, 0.0, 0.0, 1.0],    // Back face: red
                [0.0, 1.0, 0.0, 1.0],    // Top face: green
                [0.0, 0.0, 1.0, 1.0],    // Bottom face: blue
                [1.0, 1.0, 0.0, 1.0],    // Right face: yellow
                [1.0, 0.0, 1.0, 1.0],    // Left face: purple
            ];

            // Convert the array of colors into a table for all the vertices.

            var colors = [];

            for (var j = 0; j < faceColors.length; ++j) {
                const c = faceColors[j];

                // Repeat each color four times for the four vertices of the face
                colors = colors.concat(c, c, c, c);
            }
            vbo_colors.data(colors, this.gl.FLOAT, 4);

            const indices = [
                0, 1, 2, 0, 2, 3,    // front
                4, 5, 6, 4, 6, 7,    // back
                8, 9, 10, 8, 10, 11,   // top
                12, 13, 14, 12, 14, 15,   // bottom
                16, 17, 18, 16, 18, 19,   // right
                20, 21, 22, 20, 22, 23,   // left
            ];
            const vbo_indices = new VBO(this.gl, this.gl.ELEMENT_ARRAY_BUFFER);
            vbo_indices.indices(indices);

            this.vao.add_buffer(this.gl.TRIANGLES,
                vbo_indices,
                vbo_positions, vbo_uv, vbo_colors);
        }

        // Load texture
        this.texture = loadTexture(this.gl, image);

        this.camera = new Camera();
        this.camera.aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
        this.camera.recalculate();
    }

    // animation
    update(time_ms) {
        const angle = time_ms * 0.001 * Math.PI;
        this.bg = Math.sin(angle) + 1;
        this.clear_color = [this.bg, this.bg, this.bg, 1];

        this.vao.update(time_ms);
    }

    // draw
    render() {
        this.gl.clearColor(...this.clear_color);
        this.gl.clearDepth(1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.shader.enable();
        this.shader.set_mat4('uProjectionMatrix', this.camera.projection);
        this.shader.set_mat4('uViewMatrix', this.camera.view);
        this.shader.set_mat4('uModelMatrix', this.vao.matrix);
        this.vao.draw();
    }

    frame() {
        this.update(Date.now());
        this.render();
        requestAnimationFrame(() => { this.frame(); });
    }
}
