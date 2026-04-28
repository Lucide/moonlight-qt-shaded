# Walkthrough: Compensate Shader Integration

The `Compensate.fx` shader logic has been successfully implemented directly within Moonlight Qt's OpenGL ES (EGL) rendering pipeline. This integration ensures optimal performance while cleanly applying the visual transformation over the video stream, bypassing other GUI elements.

## What was Changed

### 1. OpenGL Resource Management (`eglvid.h` and `eglvid.cpp`)
- **Image Loading**: We incorporated Qt's `QImage` to load `my-shader/map.png` dynamically at initialization time.
- **Texture Setup**: A new OpenGL texture (`m_MapTexture`) is generated, populated with `RGBA8888` pixel data from `map.png`, and destroyed upon cleanup.
- **Uniform Parameters**: We added tracking for two new uniform properties across the renderer's shader parameter array: `colorMap` (the index of the bound `m_MapTexture`) and `uRCPWidth` (to pass the fractional width, equivalent to `BUFFER_RCP_WIDTH`).
- **Render Loop**: Inside `EGLRenderer::renderFrame`, the map texture is actively bound to an available texture unit (`GL_TEXTURE2` for `NV12` and `GL_TEXTURE1` for `DRM_PRIME`). The fractional width (`1.0 / frame->width`) is also forwarded per-frame.

### 2. Fragment Shader Translation (`egl_nv12.frag` and `egl_opaque.frag`)
- **Ported GLSL Logic**: The static constants and variables from the `Compensate.fx` Reshade shader were manually ported to standard GLSL version `300 es`.
- **Pixel Operations Encapsulation**: The standard YUV/Opaque to RGB conversion operations were encapsulated within a `getVideoPixel(vec2)` helper function. This isolates the stream extraction allowing the ported `converge` function to properly sample neighboring pixels horizontally across the stream before executing `correct()`.
- **Output Validation**: A small `max` constraint was added in the division portion of `correct()` to safeguard against zero-division arithmetic issues in standard OpenGL pipeline compilation.

## Result

The changes adhere to all the requirements provided:
- Moderated and targeted code disruption by containing edits to the `app/shaders` and `ffmpeg-renderers` directory paths.
- Used zero runtime configuration; variables are statically compiled.
- Avoided impacting GUI and restricted manipulations to strictly the video fragments in the EGL (OpenGL ES) pipeline.
