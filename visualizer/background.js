let bgShader;
let currentColor1, currentColor2, targetColor1, targetColor2;
let lerpAmt = 0;

const moodColors = {
  aggressive: { c1: [220, 20, 60],   c2: [80, 0, 20]    },
  euphoric:   { c1: [128, 0, 128],   c2: [60, 0, 180]   },
  melancholic:{ c1: [30, 144, 255],  c2: [0, 30, 100]   },
  calm:       { c1: [46, 139, 87],   c2: [0, 60, 40]    },
  tense:      { c1: [244, 164, 96],  c2: [140, 60, 0]   },
  default:    { c1: [40, 40, 60],    c2: [10, 10, 20]   }
};

const fragSrc = `
  precision mediump float;
  uniform float u_time;
  uniform vec2  u_res;
  uniform vec3  u_color1;
  uniform vec3  u_color2;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1,0)), u.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p  = p * 2.0 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
    float t  = u_time * 0.25;

    vec2 q = vec2(fbm(uv + t), fbm(uv + vec2(1.0)));
    vec2 r = vec2(
      fbm(uv + 4.0 * q + vec2(1.7, 9.2) + 0.15 * t),
      fbm(uv + 4.0 * q + vec2(8.3, 2.8) + 0.126 * t)
    );

    float f = fbm(uv + 4.0 * r);
    f = 0.5 + 0.5 * f;

    vec3 c1 = u_color1 / 255.0;
    vec3 c2 = u_color2 / 255.0;
    vec3 col = mix(c2, c1, clamp(f * f * 2.0, 0.0, 1.0));
    col = pow(col, vec3(0.8));

    gl_FragColor = vec4(col, 1.0);
  }
`;

const vertSrc = `
  attribute vec3 aPosition;
  void main() {
    gl_Position = vec4(aPosition * 2.0 - 1.0, 1.0);
  }
`;

function initBackground() {
  const cols = moodColors.default;
  currentColor1 = cols.c1.slice();
  currentColor2 = cols.c2.slice();
  targetColor1  = cols.c1.slice();
  targetColor2  = cols.c2.slice();
}

function setBackgroundMood(mood) {
  const cols = moodColors[mood] || moodColors.default;
  targetColor1 = cols.c1.slice();
  targetColor2 = cols.c2.slice();
  lerpAmt = 0;
}

function drawBackground() {
  if (!bgShader) {
    bgShader = createShader(vertSrc, fragSrc);
  }

  lerpAmt = min(lerpAmt + 0.01, 1.0);
  for (let i = 0; i < 3; i++) {
    currentColor1[i] = lerp(currentColor1[i], targetColor1[i], lerpAmt);
    currentColor2[i] = lerp(currentColor2[i], targetColor2[i], lerpAmt);
  }

  shader(bgShader);
  bgShader.setUniform('u_time',   millis() / 1000.0);
  bgShader.setUniform('u_res',    [width, height]);
  bgShader.setUniform('u_color1', currentColor1);
  bgShader.setUniform('u_color2', currentColor2);
  rect(0, 0, width, height);
  resetShader();
}
