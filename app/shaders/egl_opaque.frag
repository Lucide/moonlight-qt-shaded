#version 300 es
#extension GL_OES_EGL_image_external : require
precision mediump float;
out vec4 FragColor;

in vec2 vTextCoord;

uniform samplerExternalOES uTexture;

uniform sampler2D uCompensationMap;
uniform float uBufferWidth;

const vec3 horOffsets = vec3(0.000000, -0.884000, 1.069003);
const vec3 slopes = vec3(0.0, 0.0, 0.0);

vec3 curve(vec3 x) {
    return (x + slopes * x) / (1.0 + slopes * x);
}

vec3 converge(vec2 texcoord) {
    vec3 newPositions = (horOffsets * uBufferWidth) + texcoord.x;

    return vec3(
        texture2D(uTexture, vec2(newPositions.r, texcoord.y)).r,
        texture2D(uTexture, vec2(newPositions.g, texcoord.y)).g,
        texture2D(uTexture, vec2(newPositions.b, texcoord.y)).b
    );
}

vec3 correct(vec2 texcoord, vec3 color) {
    vec3 corrections = curve(texture2D(uCompensationMap, texcoord).rgb);
    float min_val = min(corrections.r, min(corrections.g, corrections.b));
    return color * min_val / max(corrections, vec3(0.00001)); // clamp to avoid division by zero
}

void main() {
    FragColor = vec4(correct(vTextCoord, converge(vTextCoord)), 1.0);
}
