import { useEffect, useRef } from "react";

/**
 * Vertex Terrain — Raw WebGL2 terrain mesh with noise-based displacement.
 * No Three.js — just shaders, a grid buffer, and a draw loop.
 */

const VERT = `#version 300 es
precision highp float;

in vec2 a_pos;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_res;

out float v_height;
out vec2 v_uv;

// Simplex-style noise in GLSL
vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                          + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                           dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x_ = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x_) - 0.5;
  vec3 ox = floor(x_ + 0.5);
  vec3 a0 = x_ - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  v_uv = a_pos * 0.5 + 0.5;

  vec2 p = a_pos;
  float n = snoise(p * 2.0 + u_time * 0.3) * 0.3
          + snoise(p * 4.0 - u_time * 0.15) * 0.15
          + snoise(p * 8.0 + u_time * 0.1) * 0.05;

  // Mouse proximity boost
  vec2 mp = u_mouse * 2.0 - 1.0;
  float md = length(p - mp);
  n += smoothstep(0.6, 0.0, md) * 0.15;

  v_height = n;

  // Isometric-ish projection
  float tilt = 0.55;
  float x = p.x;
  float y = p.y * tilt - n * 0.5;
  float aspect = u_res.x / u_res.y;
  gl_Position = vec4(x / aspect * 1.4, y * 1.4 + 0.1, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;

in float v_height;
in vec2 v_uv;
out vec4 fragColor;

void main() {
  // Color ramp: deep blue → accent purple → cyan peaks
  vec3 low  = vec3(0.04, 0.03, 0.12);
  vec3 mid  = vec3(0.42, 0.39, 1.0);  // accent
  vec3 high = vec3(0.22, 0.74, 0.97);

  float t = smoothstep(-0.3, 0.45, v_height);
  vec3 col = mix(low, mid, smoothstep(0.0, 0.5, t));
  col = mix(col, high, smoothstep(0.5, 1.0, t));

  // Wireframe-esque edge brightening via UV derivatives
  vec2 grid = abs(fract(v_uv * 40.0) - 0.5);
  float edge = 1.0 - smoothstep(0.0, 0.06, min(grid.x, grid.y));
  col += edge * 0.08;

  fragColor = vec4(col, 0.85 + t * 0.15);
}`;

const GRID_SIZE = 150;

export function VertexTerrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", { antialias: true, alpha: true });
    if (!gl) return; // WebGL2 not supported

    let raf: number;
    let mouse = [0.5, 0.5];

    // --- Compile shaders ---
    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
        console.error(gl!.getShaderInfoLog(s));
      }
      return s;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // --- Grid geometry (triangle strip rows) ---
    const verts: number[] = [];
    const indices: number[] = [];
    for (let y = 0; y <= GRID_SIZE; y++) {
      for (let x = 0; x <= GRID_SIZE; x++) {
        verts.push((x / GRID_SIZE) * 2 - 1, (y / GRID_SIZE) * 2 - 1);
      }
    }
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const i = y * (GRID_SIZE + 1) + x;
        indices.push(i, i + 1, i + GRID_SIZE + 1);
        indices.push(i + 1, i + GRID_SIZE + 2, i + GRID_SIZE + 1);
      }
    }

    const vBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    const iBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uRes = gl.getUniformLocation(prog, "u_res");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }

    resize();

    const start = performance.now();
    function draw() {
      const t = (performance.now() - start) / 1000;
      const rect = canvas!.getBoundingClientRect();

      gl!.clearColor(0.039, 0.039, 0.039, 1);
      gl!.clear(gl!.COLOR_BUFFER_BIT);

      gl!.uniform1f(uTime, t);
      gl!.uniform2f(uMouse, mouse[0], mouse[1]);
      gl!.uniform2f(uRes, rect.width, rect.height);

      gl!.drawElements(gl!.TRIANGLES, indices.length, gl!.UNSIGNED_INT, 0);
      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse = [
        (e.clientX - rect.left) / rect.width,
        (e.clientY - rect.top) / rect.height,
      ];
    }

    canvas.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
