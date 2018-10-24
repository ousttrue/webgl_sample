class Renderer {

    constructor(canvas_id) {
        const canvas = document.querySelector(canvas_id);
        this.gl = canvas.getContext("webgl2");
        if (this.gl === null) {
            alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        }
    }

    // animation
    update(time_ms) {
        const angle = time_ms * 0.001 * Math.PI;
        this.bg = Math.sin(angle) + 1;
        this.clear_color = [this.bg, this.bg, this.bg, 1];
    }

    // draw
    render(gl) {
        // Set clear color to black, fully opaque
        gl.clearColor(...this.clear_color);
        // Clear the color buffer with specified clear color
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    frame() {
        this.update(Date.now());
        this.render(this.gl);
        requestAnimationFrame(() => { this.frame(); });
    }
}
