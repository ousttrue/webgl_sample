varying highp vec2 vTextureCoord;
varying lowp vec4 vColor;
varying highp vec3 vLighting;

uniform sampler2D uSampler;

void main(void) {
  highp vec4 texelColor = texture2D(uSampler, vTextureCoord) + vColor;
  gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
}
