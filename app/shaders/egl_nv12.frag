#version 300 es
#extension GL_OES_EGL_image_external : require
precision mediump float;
out vec4 FragColor;

in vec2 vTextCoord;

uniform mat3 yuvmat;
uniform vec3 offset;
uniform samplerExternalOES plane1;
uniform samplerExternalOES plane2;

uniform sampler2D colorMap;
uniform float uRCPWidth;

const float rHorOffset = 0.000000;
const float gHorOffset = -0.884000;
const float bHorOffset = 1.069003;
const float rSlope = 0.0;
const float gSlope = 0.0;
const float bSlope = 0.0;

vec3 getVideoPixel(vec2 texcoord) {
	vec3 YCbCr = vec3(
		texture2D(plane1, texcoord)[0],
		texture2D(plane2, texcoord).xy
	);

	YCbCr -= offset;
	return clamp(yuvmat * YCbCr, 0.0, 1.0);
}

vec3 curve(vec3 x) {
    const vec3 slopes = vec3(rSlope, gSlope, bSlope);
    return (x + slopes * x) / (1.0 + slopes * x);
}

vec3 converge(vec2 texcoord) {
    const vec3 horizontalOffsetsNorm = vec3(rHorOffset, gHorOffset, bHorOffset) * uRCPWidth;
    return vec3(
        getVideoPixel(vec2(texcoord.x + horizontalOffsetsNorm.r, texcoord.y)).r,
        getVideoPixel(vec2(texcoord.x + horizontalOffsetsNorm.g, texcoord.y)).g,
        getVideoPixel(vec2(texcoord.x + horizontalOffsetsNorm.b, texcoord.y)).b
    );
}

vec3 correct(vec2 texcoord, vec3 color) {
    vec3 corrections = curve(texture2D(colorMap, texcoord).rgb);
    float min_val = min(corrections.r, min(corrections.g, corrections.b));
    return color * min_val / max(corrections, vec3(0.00001));
}

void main() {
	FragColor = vec4(correct(vTextCoord, converge(vTextCoord)), 1.0f);
}
