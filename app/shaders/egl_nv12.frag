#version 300 es
#extension GL_OES_EGL_image_external : require
precision mediump float;
out vec4 FragColor;

in vec2 vTextCoord;

uniform mat3 yuvmat;
uniform vec3 offset;
uniform samplerExternalOES plane1;
uniform samplerExternalOES plane2;

uniform sampler2D uCompensationMap;
uniform float uBufferWidth;

const vec3 horOffsets = vec3(0.000000, -0.884000, 1.069003);
const vec3 slopes = vec3(0.0, 0.0, 0.0);

vec3 asRGB(vec2 texcoord) {
	vec3 YCbCr = vec3(
		texture2D(plane1, texcoord)[0],
		texture2D(plane2, texcoord).xy
	);
	YCbCr -= offset;
	return clamp(yuvmat * YCbCr, 0.0, 1.0);
}

vec3 curve(vec3 x) {
    return (x + slopes * x) / (1.0 + slopes * x);
}

vec3 converge(vec2 texcoord) {
    vec3 newPositions = (horOffsets * uBufferWidth) + texcoord.x;

    return vec3(
        asRGB(vec2(newPositions.r, texcoord.y)).r,
        asRGB(vec2(newPositions.g, texcoord.y)).g,
        asRGB(vec2(newPositions.b, texcoord.y)).b
    );
}

vec3 correct(vec2 texcoord, vec3 color) {
    vec3 corrections = curve(texture2D(uCompensationMap, texcoord).rgb);
    float min_val = min(corrections.r, min(corrections.g, corrections.b));
    return color * min_val / max(corrections, vec3(0.00001)); // clamp to avoid division by zero
}

void main() {
	FragColor = vec4(correct(vTextCoord, converge(vTextCoord)), 1.0f);
}
