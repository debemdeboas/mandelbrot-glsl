// Vertex
#version 450 core
layout (location = 0) in vec2 pos;         // glVertex2f <-1,+1>
out smooth vec2 p32;                    // texture end point <0,1>
void main() {
    p32 = pos;
    gl_Position = vec4(pos, 0.0, 1.0);
}