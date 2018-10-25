attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;
attribute vec4 aVertexColor;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

varying highp vec2 vTextureCoord;
varying lowp vec4 vColor;
varying highp vec3 vLighting;

void main(void) {
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
  vTextureCoord = aTextureCoord;
  vColor = aVertexColor;

  // Apply lighting effect
  highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
  highp vec3 directionalLightColor = vec3(1, 1, 1);
  highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

  highp vec4 transformedNormal = uViewMatrix * uModelMatrix * vec4(aVertexNormal, 1.0);
  highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
  vLighting = ambientLight + (directionalLightColor * directional);
}
