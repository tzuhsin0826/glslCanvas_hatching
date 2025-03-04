#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_tex0; //data/IMG_0273.JPG
//uniform sampler2D u_tex1;

// Cellular noise ("Worley noise") in 2D in GLSL.
// Copyright (c) Stefan Gustavson 2011-04-19. All rights reserved.
// This code is released under the conditions of the MIT license.
// See LICENSE file for details.

// Permutation polynomial: (34x^2 + x) mod 289
vec4 permute(vec4 x) {
  return mod((34.0 * x + 1.0) * x, 289.0);
}

// Cellular noise, returning F1 and F2 in a vec2.
// Speeded up by using 2x2 search window instead of 3x3,
// at the expense of some strong pattern artifacts.
// F2 is often wrong and has sharp discontinuities.
// If you need a smooth F2, use the slower 3x3 version.
// F1 is sometimes wrong, too, but OK for most purposes.
vec2 cellular2x2(vec2 P) {
#define K 0.142857142857 // 1/7
#define K2 0.0714285714285 // K/2
#define jitter 0.8 // jitter 1.0 makes F1 wrong more often
 vec2 Pi = mod(floor(P), 289.0);
  vec2 Pf = fract(P);
 vec4 Pfx = Pf.x + vec4(-0.5, -1.5, -0.5, -1.5);
 vec4 Pfy = Pf.y + vec4(-0.5, -0.5, -1.5, -1.5);
 vec4 p = permute(Pi.x + vec4(0.0, 1.0, 0.0, 1.0));
 p = permute(p + Pi.y + vec4(0.0, 0.0, 1.0, 1.0));
 vec4 ox = mod(p, 5.0)*K+K2;
 vec4 oy = mod(floor(p*K),5.0)*K+K2;
 vec4 dx = Pfx + jitter*ox;
 vec4 dy = Pfy + jitter*oy;
 vec4 d = dx * dx + dy * dy; // d11, d12, d21 and d22, squared
 // Sort out the two smallest distances
#if 0
 // Cheat and pick only F1
 d.xy = min(d.xy, d.zw);
 d.x = min(d.x, d.y);
 return d.xx; // F1 duplicated, F2 not computed
#else
 // Do it right and find both F1 and F2
 d.xy = (d.x < d.y) ? d.xy : d.yx; // Swap if smaller
 d.xz = (d.x < d.z) ? d.xz : d.zx;
 d.xw = (d.x < d.w) ? d.xw : d.wx;
 d.y = min(d.y, d.z);
 d.y = min(d.y, d.w);
 return sqrt(d.xy);
#endif
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st = (st-.5)*1.0+.5;//圖片大小
    if (u_resolution.y > u_resolution.x ) {
        st.y *= u_resolution.y/u_resolution.x;
        st.y -= (u_resolution.y*.5-u_resolution.x*.5)/u_resolution.x;
    } else {
        st.x *= u_resolution.x/u_resolution.y;
        st.x -= (u_resolution.x*.5-u_resolution.y*.5)/u_resolution.y;
    }

    vec2 F = cellular2x2(st*10.);//馬賽克有多少格

    vec2 pos = st-.3;
    float a = dot(pos,pos)-u_time*0.2;//圖片運作時間

    float n = 0.8-step(abs(sin(a))-.1,.05+(F.x-F.y)*1.5);

    // Fetch color from the texture
    vec4 texColor = texture2D(u_tex0, st);
    
    // Combine the texture color with the noise effect
    // Here, I'm simply mixing them based on the noise value 'n'
    vec4 combinedColor = mix(texColor, vec4(n, n, n, 10.0), n);

    gl_FragColor = combinedColor;
}
