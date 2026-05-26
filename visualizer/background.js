// background.js — raw WebGL background, one domain-warped FBM shader per mood.
// All 5 moods share the same base algorithm; they differ in speed, warp
// strength, spatial scale, and color palette so they feel related but distinct.

// ─── Shared GLSL helpers (inlined into every shader) ─────────────────────────
const COMMON = `
  precision mediump float;
  uniform float u_time;
  uniform vec2  u_res;

  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }

  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p), u=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),         hash(i+vec2(1,0)), u.x),
               mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y);
  }

  float fbm(vec2 p){
    float v=0.0, a=0.5;
    for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.0+vec2(1.7,9.2); a*=0.5; }
    return v;
  }

  // 3-stop linear palette  (f in [0,1])
  vec3 palette(float f, vec3 c0, vec3 c1, vec3 c2){
    return f<0.5 ? mix(c0,c1,f*2.0) : mix(c1,c2,(f-0.5)*2.0);
  }
`;

// ─── Per-mood main() — only speed / scale / warp / palette differ ────────────
//
//  SPEED  → how fast the warp animates
//  SCALE  → spatial zoom (higher = more turbulent / fine-grained)
//  WQ     → strength of the first warp layer  (q distorts uv)
//  WR     → strength of the second warp layer (r distorts further)
//  C0/C1/C2 → 3-stop colour gradient applied to the final FBM value

function moodMain({ speed, scale, wq, wr, c0, c1, c2 }) {
  const [r0,g0,b0] = c0, [r1,g1,b1] = c1, [r2,g2,b2] = c2;
  return `
    void main(){
      vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / min(u_res.x,u_res.y);
      float t  = u_time * ${speed.toFixed(3)};
      uv *= ${scale.toFixed(3)};

      // two-pass domain warp (Inigo Quilez technique)
      vec2 q = vec2(fbm(uv         + t*0.5),
                    fbm(uv         + vec2(1.0)));
      vec2 r = vec2(fbm(uv + ${wq.toFixed(2)}*q + vec2(1.7,9.2) + t*0.15),
                    fbm(uv + ${wq.toFixed(2)}*q + vec2(8.3,2.8) + t*0.12));
      float f = fbm(uv + ${wr.toFixed(2)}*r);
      f = clamp(0.4 + 0.6*f, 0.0, 1.0);

      vec3 col = palette(f,
        vec3(${r0.toFixed(3)},${g0.toFixed(3)},${b0.toFixed(3)}),
        vec3(${r1.toFixed(3)},${g1.toFixed(3)},${b1.toFixed(3)}),
        vec3(${r2.toFixed(3)},${g2.toFixed(3)},${b2.toFixed(3)}));
      col = pow(col, vec3(0.85));
      gl_FragColor = vec4(col, 1.0);
    }
  `;
}

const MOOD_PARAMS = {
  // Fast, tight warp, high spatial freq → chaotic feel. Crimson → orange.
  aggressive: { speed:0.50, scale:2.0, wq:1.2, wr:5.5,
    c0:[0.04,0.00,0.00], c1:[0.55,0.00,0.00], c2:[1.00,0.40,0.00] },

  // Slow, gentle warp, low spatial freq → dreamy. Dark navy → steel blue.
  melancholic: { speed:0.10, scale:0.9, wq:0.7, wr:3.0,
    c0:[0.00,0.01,0.08], c1:[0.02,0.08,0.35], c2:[0.10,0.28,0.70] },

  // Medium-fast, high spatial freq, jagged warp → edgy. Black → amber.
  tense: { speed:0.35, scale:2.6, wq:1.3, wr:4.5,
    c0:[0.03,0.01,0.00], c1:[0.45,0.22,0.00], c2:[0.95,0.62,0.05] },

  // Very slow, wide warp, low spatial freq → smooth. Dark teal → seafoam.
  calm: { speed:0.06, scale:0.70, wq:0.5, wr:2.0,
    c0:[0.00,0.05,0.05], c1:[0.00,0.22,0.16], c2:[0.04,0.48,0.34] },

  // Fast + extreme warp → swirling. Dark purple → violet → hot pink.
  euphoric: { speed:0.45, scale:1.5, wq:1.6, wr:7.0,
    c0:[0.08,0.00,0.12], c1:[0.35,0.00,0.55], c2:[0.85,0.05,0.75] },

  // Idle / no mood yet: slow, desaturated blue-grey nebula.
  default:  { speed:0.18, scale:1.0, wq:1.0, wr:4.0,
    c0:[0.03,0.03,0.06], c1:[0.08,0.08,0.18], c2:[0.16,0.18,0.30] },
};

// Build the complete GLSL source for each mood
const MOOD_SHADERS = {};
for (const [mood, params] of Object.entries(MOOD_PARAMS)) {
  MOOD_SHADERS[mood] = COMMON + moodMain(params);
}

// ─── WebGL plumbing ───────────────────────────────────────────────────────────

const VERT_SRC = `
  attribute vec2 a_pos;
  void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

let _canvas, _gl, _program = null, _buf = null;
let _t0 = Date.now();

function _makeShader(type, src) {
  const s = _gl.createShader(type);
  _gl.shaderSource(s, src);
  _gl.compileShader(s);
  if (!_gl.getShaderParameter(s, _gl.COMPILE_STATUS))
    console.error('BG shader error:', _gl.getShaderInfoLog(s));
  return s;
}

function _compile(fragSrc) {
  const gl = _gl;
  if (_program) gl.deleteProgram(_program);

  _program = gl.createProgram();
  gl.attachShader(_program, _makeShader(gl.VERTEX_SHADER,   VERT_SRC));
  gl.attachShader(_program, _makeShader(gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(_program);

  if (!_buf) {
    _buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, _buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, _buf);
  const loc = gl.getAttribLocation(_program, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
}

function _resize() {
  _canvas.width  = window.innerWidth;
  _canvas.height = window.innerHeight;
  if (_gl) _gl.viewport(0, 0, _canvas.width, _canvas.height);
}

function _render() {
  requestAnimationFrame(_render);
  if (!_gl || !_program) return;
  const gl = _gl;
  const t  = (Date.now() - _t0) / 1000.0;
  gl.useProgram(_program);
  gl.uniform1f(gl.getUniformLocation(_program, 'u_time'), t);
  gl.uniform2f(gl.getUniformLocation(_program, 'u_res'), _canvas.width, _canvas.height);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// ─── Public API ───────────────────────────────────────────────────────────────

function initBackground() {
  _canvas = document.getElementById('bg-canvas');
  _gl     = _canvas.getContext('webgl');
  if (!_gl) { console.error('WebGL not supported'); return; }
  _resize();
  window.addEventListener('resize', _resize);
  _compile(MOOD_SHADERS.default);
  _render();
}

function setBackgroundMood(mood) {
  if (_gl) _compile(MOOD_SHADERS[mood] || MOOD_SHADERS.default);
}
