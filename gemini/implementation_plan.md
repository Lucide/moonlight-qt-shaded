# Goal Description

Integrate the `Compensate.fx` fragment shader logic over the video stream in Moonlight Qt. The `map.png` file will be loaded as a uniform texture (sampler2D). The parameters from the shader will be statically compiled into the OpenGL fragment shaders. The focus is to modify the EGL OpenGL renderer (`eglvid.cpp`) because an OpenGL runtime environment is the main focus.

## Proposed Changes

### app/streaming/video/ffmpeg-renderers/eglvid.h
- [MODIFY] `app/streaming/video/ffmpeg-renderers/eglvid.h`
  - Add `unsigned m_MapTexture;` to `EGLRenderer` class to manage the `map.png` OpenGL texture.
  - Add uniform location tracking variables for `colorMap` and `uRCPWidth`.

### app/streaming/video/ffmpeg-renderers/eglvid.cpp
- [MODIFY] `app/streaming/video/ffmpeg-renderers/eglvid.cpp`
  - **Initialization:** `#include <QImage>` and use it in `initialize()` to load `my-shader/map.png` into a `QImage`. Convert the image to `RGBA8888` and upload to a new OpenGL texture using `glTexImage2D`.
  - **Cleanup:** Release the new texture in the destructor.
  - **Shader Compilation:** Inside `compileShaders()`, query and store the uniform locations for `colorMap` and `uRCPWidth`.
  - **Rendering:** In `renderFrame()`, bind `m_MapTexture` to an active texture slot (e.g. `GL_TEXTURE3`), set the `colorMap` uniform to that slot, and pass `1.0f / frame->width` as the `uRCPWidth` uniform to allow the shader to offset pixels horizontally.

### app/shaders/egl_nv12.frag
- [MODIFY] `app/shaders/egl_nv12.frag`
  - Encapsulate the current NV12 to RGB conversion inside a helper function `vec3 getVideoPixel(vec2 coord)`.
  - Add `uniform sampler2D colorMap;` and `uniform float uRCPWidth;`.
  - Translate the static constants, `curve()`, `converge()`, and `correct()` from HLSL to GLSL.
  - Inside `main()`, use `FragColor = vec4(correct(vTextCoord, converge(vTextCoord)), 1.0);`

### app/shaders/egl_opaque.frag
- [MODIFY] `app/shaders/egl_opaque.frag`
  - Create a helper `vec3 getVideoPixel(vec2 coord) { return texture2D(uTexture, coord).rgb; }`.
  - Add the same `curve()`, `converge()`, and `correct()` translated functions and uniforms as the NV12 shader.
  - Apply the corrected output to `FragColor`.

## Verification Plan
### Manual Verification
- Code review of GLSL translations for semantic correctness.
- Code review of OpenGL resource management (texture creation, binding, and uniform passing) to ensure no resource leaks or unbound textures occur.
