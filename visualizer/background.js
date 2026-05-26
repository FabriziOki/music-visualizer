// background.js — raw WebGL background, one shader per mood
// Runs on #bg-canvas, completely separate from the p5 canvas.

const MOOD_SHADERS = {

  // ── Aggressive: fire/lava rising from the bottom ──────────────────────────
  aggressive: `
    precision mediump float;
    uniform float u_time;
    uniform vec2  u_res;

    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p), u=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),
                 mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
    }
    float fbm(vec2 p){
      float v=0.0,a=0.5;
      for(int i=0;i<6;i++){v+=a*noise(p);p=p*2.1+vec2(1.7,9.2);a*=0.5;}
      return v;
    }

    void main(){
      vec2 uv = gl_FragCoord.xy / u_res;
      float t  = u_time * 1.1;

      // distort upward like heat
      vec2 q = vec2(fbm(uv*2.5 + vec2(0.0, -t*0.6)),
                    fbm(uv*2.5 + vec2(1.7,  -t*0.4)));
      float f = fbm(uv*3.0 + 4.0*q + vec2(0.0,-t*0.8));

      // fire fades toward the top
      f = clamp(f * 1.6 - uv.y * 0.9, 0.0, 1.0);

      vec3 col = vec3(0.05, 0.0, 0.0);
      col = mix(col, vec3(0.7, 0.0, 0.0),  smoothstep(0.0, 0.4, f));
      col = mix(col, vec3(1.0, 0.25, 0.0), smoothstep(0.4, 0.7, f));
      col = mix(col, vec3(1.0, 0.85, 0.1), smoothstep(0.7, 1.0, f));

      gl_FragColor = vec4(col, 1.0);
    }
  `,

  // ── Melancholic: night rain on a dark window ───────────────────────────────
  melancholic: `
    precision mediump float;
    uniform float u_time;
    uniform vec2  u_res;

    float hash1(float n){ return fract(sin(n)*43758.5453); }
    float hash2(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }

    float raindrop(vec2 uv, float col, float t){
      float speed  = 0.6 + hash1(col) * 0.5;
      float offset = hash1(col * 7.3) * 6.28;
      float y = fract(uv.y + t * speed + offset);
      float x = fract(uv.x);
      float streak = smoothstep(0.48,0.5,x) * smoothstep(0.52,0.5,x);
      streak *= smoothstep(0.0,0.04,y) * smoothstep(0.18,0.0,y);
      return streak;
    }

    void main(){
      vec2 uv = gl_FragCoord.xy / u_res;
      float t  = u_time * 0.55;

      // two layers of rain at different scales
      float cols1 = 35.0, cols2 = 20.0;
      float r = raindrop(vec2(uv.x*cols1, uv.y), floor(uv.x*cols1), t)
              + raindrop(vec2(uv.x*cols2, uv.y*0.8+0.1), floor(uv.x*cols2)*3.7, t*0.7)*0.5;

      // faint window reflection glow at the bottom
      float glow = smoothstep(0.4, 0.0, uv.y) * 0.08;

      vec3 bg  = mix(vec3(0.0, 0.01, 0.06), vec3(0.01, 0.04, 0.12), uv.y);
      vec3 col = bg + vec3(0.15, 0.45, 1.0) * r * 0.7 + vec3(0.05, 0.1, 0.3) * glow;

      gl_FragColor = vec4(col, 1.0);
    }
  `,

  // ── Tense: radar-like expanding rings with flicker ─────────────────────────
  tense: `
    precision mediump float;
    uniform float u_time;
    uniform vec2  u_res;

    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }

    void main(){
      vec2 uv  = (gl_FragCoord.xy - 0.5*u_res) / min(u_res.x, u_res.y);
      float t  = u_time;
      float d  = length(uv);
      float a  = atan(uv.y, uv.x);

      // rings
      float rings = 0.0;
      for(int i=0;i<5;i++){
        float fi    = float(i);
        float speed = 0.35 + fi*0.08;
        float r     = fract(d*2.5 - t*speed + fi*0.2);
        float ring  = smoothstep(0.04,0.0,r);
        // fade with distance so center is brightest
        rings += ring * (1.0 - d*0.7);
      }

      // scanline / grid noise to feel glitchy
      float grid = step(0.97, fract(gl_FragCoord.y / 4.0)) * 0.15;

      // high-frequency flicker
      float flicker = 0.82 + 0.18*sin(t*47.0)*sin(t*13.0);

      vec3 bg  = vec3(0.03, 0.01, 0.0);
      vec3 col = bg + vec3(0.95, 0.5, 0.05)*(rings*flicker + grid);

      gl_FragColor = vec4(col, 1.0);
    }
  `,

  // ── Calm: slow deep-water surface ─────────────────────────────────────────
  calm: `
    precision mediump float;
    uniform float u_time;
    uniform vec2  u_res;

    void main(){
      vec2 uv = gl_FragCoord.xy / u_res;
      float t  = u_time * 0.28;

      // layered sine waves displaced in x and time
      float w  = 0.0;
      w += sin(uv.x*5.0  + t*1.0       ) * 0.04;
      w += sin(uv.x*9.0  + t*0.7 + 1.0 ) * 0.025;
      w += sin(uv.x*3.0  + t*1.3 + 2.5 ) * 0.06;
      w += sin(uv.x*15.0 + t*0.5 + 0.8 ) * 0.01;

      float waterLine = 0.5 + w;
      float inWater   = smoothstep(waterLine, waterLine-0.02, uv.y);

      // subtle specular shimmer on the surface
      float shimmer = sin(uv.x*40.0 + t*3.0)*sin(uv.y*25.0 - t*2.0)*0.04;
      shimmer *= smoothstep(waterLine+0.01, waterLine-0.01, uv.y);

      vec3 sky   = mix(vec3(0.03,0.09,0.08), vec3(0.05,0.14,0.10), uv.y);
      vec3 water = mix(vec3(0.0,0.22,0.15),  vec3(0.0,0.08,0.06),  uv.y);
      vec3 col   = mix(sky, water + shimmer, inWater);

      gl_FragColor = vec4(col, 1.0);
    }
  `,

  // ── Euphoric: neon plasma swirl ────────────────────────────────────────────
  euphoric: `
    precision mediump float;
    uniform float u_time;
    uniform vec2  u_res;

    void main(){
      vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / min(u_res.x, u_res.y);
      float t  = u_time * 0.45;

      // classic plasma — sum of waves from different centres
      float v = 0.0;
      v += sin(uv.x*3.0 + t);
      v += sin(uv.y*3.0 + t*0.9);
      v += sin((uv.x+uv.y)*2.5 + t*1.1);
      v += sin(length(uv - vec2( 0.3, 0.2))*5.0 - t*1.4);
      v += sin(length(uv - vec2(-0.2,-0.3))*4.0 - t*1.6);
      v = v * 0.2 + 0.5;   // normalise to [0,1]

      // purple / magenta / pink palette
      vec3 col;
      col.r = 0.35 + 0.55*sin(v*6.28318 + 0.0);
      col.g = 0.00 + 0.20*sin(v*6.28318 + 2.09);
      col.b = 0.50 + 0.45*sin(v*6.28318 + 4.19);
      col   = clamp(col * 0.85, 0.0, 1.0);  // slight dim so bars pop

      gl_FragColor = vec4(col, 1.0);
    }
  `,

  // ── Default (no mood): slow dark nebula ───────────────────────────────────
  default: `
    precision mediump float;
    uniform float u_time;
    uniform vec2  u_res;

    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),
                 mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
    }
    float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.0;a*=0.5;}return v;}

    void main(){
      vec2 uv=(gl_FragCoord.xy-0.5*u_res)/min(u_res.x,u_res.y);
      float t=u_time*0.18;
      vec2 q=vec2(fbm(uv+t),fbm(uv+vec2(1.0)));
      float f=fbm(uv+4.0*q+t*0.1);
      f=0.5+0.5*f;
      vec3 col=mix(vec3(0.04,0.04,0.08),vec3(0.12,0.12,0.22),f*f);
      gl_FragColor=vec4(col,1.0);
    }
  `
};

// ─── WebGL plumbing ───────────────────────────────────────────────────────────

const VERT_SRC = `
  attribute vec2 a_pos;
  void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

let _canvas, _gl, _program = null, _buf = null;
let _currentMood = 'default';
let _t0 = Date.now();

function _compile(fragSrc) {
  const gl = _gl;

  function mkShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      console.error('BG shader error:', gl.getShaderInfoLog(s));
    return s;
  }

  if (_program) gl.deleteProgram(_program);
  _program = gl.createProgram();
  gl.attachShader(_program, mkShader(gl.VERTEX_SHADER,   VERT_SRC));
  gl.attachShader(_program, mkShader(gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(_program);

  // full-screen triangle strip quad
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

// ─── Public API (called by sketch.js) ────────────────────────────────────────

function initBackground() {
  _canvas = document.getElementById('bg-canvas');
  _gl     = _canvas.getContext('webgl');
  if (!_gl) { console.error('WebGL not supported'); return; }

  _resize();
  window.addEventListener('resize', _resize);

  _compile(MOOD_SHADERS[_currentMood]);
  _render();
}

function setBackgroundMood(mood) {
  _currentMood = mood;
  if (_gl) _compile(MOOD_SHADERS[mood] || MOOD_SHADERS.default);
}
