function create_scene() {

    const mesh = new Mesh();

    //
    // positions
    //
    mesh.add_attribute(new VertexAttribute('aVertexPosition', 3, [
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
    ]));

    //
    // normals
    //
    const normals = [
        // Front
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,

        // Back
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,

        // Top
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,

        // Bottom
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,

        // Right
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,

        // Left
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0
    ];
    mesh.add_attribute(new VertexAttribute('aVertexNormal', 3, normals));

    //
    // uv
    //
    mesh.add_attribute(new VertexAttribute('aTextureCoord', 2, [
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
    ]));

    //
    // vertex color
    //
    const faceColors = [
        [0.0, 1.0, 1.0, 1.0],    // Front face: white
        [1.0, 0.0, 0.0, 1.0],    // Back face: red
        [0.0, 1.0, 0.0, 1.0],    // Top face: green
        [0.0, 0.0, 1.0, 1.0],    // Bottom face: blue
        [1.0, 1.0, 0.0, 1.0],    // Right face: yellow
        [1.0, 0.0, 1.0, 1.0],    // Left face: purple
    ];
    var colors = [];
    for (var j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j];
        colors = colors.concat(c, c, c, c);
    }
    mesh.add_attribute(new VertexAttribute('aVertexColor', 4, colors));

    //
    // indices
    //
    const indices = [
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // back
        8, 9, 10, 8, 10, 11,   // top
        12, 13, 14, 12, 14, 15,   // bottom
        16, 17, 18, 16, 18, 19,   // right
        20, 21, 22, 20, 22, 23,   // left
    ];
    mesh.set_indices(indices);

    return mesh;
}
