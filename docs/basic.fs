varying highp vec2 vTextureCoord;
varying lowp vec4 vColor;

uniform sampler2D uSampler;

void main(void) {
  gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor;
  //gl_FragColor = vColor;
  //gl_FragColor = vec4(1, 1, 1, 1);
}
