class VertexAttribute {
    constructor(name, element_count, values) {
        this.name = name;
        this.element_count = element_count;
        this.values = values;
    }
}

class Mesh {
    constructor(indices) {
        this.attributes = [];
    }
    add_attribute(attribute) {
        this.attributes.push(attribute);
    }
    set_indices(indices) {
        this.indices = indices;
    }
}

class Texture {

    constructor(gl) {
        this.gl = gl;
        this.id = gl.createTexture();
    }

    load(image) {
        this.enable();

        const level = 0;
        const internalFormat = this.gl.RGBA;
        const srcFormat = this.gl.RGBA;
        const srcType = this.gl.UNSIGNED_BYTE;
        this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        function isPowerOf2(value) {
            return (value & (value - 1)) == 0;
        }
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn of mips and set
            // wrapping to clamp to edge
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        }
    }

    enable() {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
    }

    activate(unit) {
        this.enable();
        switch (unit) {
            case 0: this.gl.activeTexture(this.gl.TEXTURE0); break;
            default:
                console.error("unknown unit: " + unit);
                break;
        }

        // Tell the shader we bound the texture to texture unit 0
        //this.gl.uniform1i(programInfo.uniformLocations.uSampler, unit);
    }
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        console.error('An error occurred compiling the shaders: ' + info);
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
            console.error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(this.id));
            return false;
        }

        this.uniformLocations = {
        }

        return true;
    }

    enable() {
        this.gl.useProgram(this.id);
    }

    get_attrib_loc(key) {
        return this.gl.getAttribLocation(this.id, key);
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
            console.error("not ELEMENT_ARRAY_BUFFER");
        }
        this.enable();
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(values),
            this.gl.STATIC_DRAW);
        this.vertex_count = values.length;
    }

    data(values, element_type, elements) {
        if (this.type != this.gl.ARRAY_BUFFER) {
            console.error("not ARRAY_BUFFER");
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

    load(mesh, shader) {
        this.enable();
        for (const attr of mesh.attributes) {
            const vbo = new VBO(this.gl, this.gl.ARRAY_BUFFER);
            vbo.data(attr.values, this.gl.FLOAT, attr.element_count);
            const loc = shader.get_attrib_loc(attr.name);
            if (loc < 0) {
                console.error(`${attr.name} location is not found`);
            }

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

            this.buffers.push(vbo);
        }

        this.topology = this.gl.TRIANGLES;
        this.indices = new VBO(this.gl, this.gl.ELEMENT_ARRAY_BUFFER);
        this.indices.indices(mesh.indices);
        this.indices.enable();

        this.disable();
    }

    enable() {
        this.ext.bindVertexArrayOES(this.id);
    }

    disable() {
        this.ext.bindVertexArrayOES(null);
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
            console.error("Unable to initialize WebGL. Your browser or machine may not support it.");
        }
    }

    initialize_scene(vs, fs, mesh, image) {

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.enable(this.gl.CULL_FACE);

        this.shader = new Shader(this.gl);
        this.shader.compile(vs, fs);

        // mesh
        this.vao = new VAO(this.gl);
        this.vao.load(mesh, this.shader);

        // Load texture
        this.texture = new Texture(this.gl);
        this.texture.load(image);

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

        this.texture.activate(0);

        this.vao.draw();
    }

    frame() {
        this.update(Date.now());
        this.render();
        requestAnimationFrame(() => { this.frame(); });
    }
}
