/**
 * Green Moray Eel (Morayeelfish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 195x34px
 * Bespoke HTML5 Canvas 2D renderer — zero external dependencies.
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const ONE_SHOTS = { left_turn: 0.65, right_turn: 0.65, eating: 0.55, shock: 0.8 };
const BLEND_TIME = 0.15;

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function easeCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

function normalizeState(name) {
  if (typeof name !== 'string') return null;
  const k = name.trim().toLowerCase();
  const s = ALIASES[k] || k;
  return VALID_STATES.has(s) ? s : null;
}

function canTransition(from, to) {
  if (!to) return false;
  if (from === 'shock') return to === 'fear';
  if (from === 'fear') {
    return !(to === 'left_turn' || to === 'right_turn' || to === 'relax' || to === 'happy' || to === 'eating' || to === 'hungry' || to === 'sad');
  }
  if (from === 'left_turn' || from === 'right_turn' || from === 'eating') {
    return to === 'shock' || to === 'fear' || to === 'stress';
  }
  return true;
}

function sampleMorayPose(state, t) {
  const p = {
    waveAmp: 0.09, waveFreq: 2.8, phase: t * 2.8, turn: 0,
    jawOpen: 0.12, gillFlare: 0.1, ruffleAmp: 2.5,
    eyeScale: 1, jitterX: 0, jitterY: 0, bobY: 0, pulse: 1
  };
  switch (state) {
    case 'breathing':
      p.waveAmp = 0.08; p.waveFreq = 2.1; p.phase = t * 2.1;
      p.jawOpen = 0.18 + Math.sin(t * 2.6) * 0.12;
      p.gillFlare = 0.15 + Math.sin(t * 2.6) * 0.12;
      p.pulse = 1 + Math.sin(t * 2.6) * 0.025;
      break;
    case 'swimming':
      p.waveAmp = 0.24; p.waveFreq = 7.4; p.phase = t * 7.4;
      p.jawOpen = 0.1 + Math.sin(t * 5) * 0.06;
      p.ruffleAmp = 4.6;
      break;
    case 'relax':
      p.waveAmp = 0.05; p.waveFreq = 1.3; p.phase = t * 1.3;
      p.jawOpen = 0.06; p.bobY = Math.sin(t * 1.5) * 1.5;
      break;
    case 'left_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.left_turn, 0, 1) * Math.PI);
      p.waveAmp = 0.14; p.waveFreq = 5.5; p.phase = t * 5.5;
      p.turn = -0.34 * k; p.ruffleAmp = 4.0;
      break;
    }
    case 'right_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.right_turn, 0, 1) * Math.PI);
      p.waveAmp = 0.14; p.waveFreq = 5.5; p.phase = t * 5.5;
      p.turn = 0.34 * k; p.ruffleAmp = 4.0;
      break;
    }
    case 'eating': {
      const k = Math.sin(clamp(t / ONE_SHOTS.eating, 0, 1) * Math.PI);
      p.waveAmp = 0.16; p.waveFreq = 6.5; p.phase = t * 6.5;
      p.jawOpen = 0.15 + k * 0.85; p.pulse = 1 + k * 0.06;
      break;
    }
    case 'hungry':
      p.waveAmp = 0.16; p.waveFreq = 5.4; p.phase = t * 5.4;
      p.jawOpen = 0.35 + Math.abs(Math.sin(t * 8.5)) * 0.45;
      p.eyeScale = 1.12;
      break;
    case 'stress':
      p.waveAmp = 0.22; p.waveFreq = 11; p.phase = t * 11;
      p.jitterX = Math.sin(t * 42) * 1.3; p.jitterY = Math.cos(t * 37) * 1.1;
      p.jawOpen = 0.35;
      break;
    case 'fear':
      p.waveAmp = 0.26; p.waveFreq = 14; p.phase = t * 14;
      p.jitterX = Math.sin(t * 50) * 1.9; p.jitterY = Math.cos(t * 45) * 1.6;
      p.eyeScale = 1.24; p.jawOpen = 0.28;
      break;
    case 'shock': {
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.waveAmp = 0.06; p.waveFreq = 16; p.phase = t * 16;
      p.jitterX = Math.sin(t * 58) * 2.2 * k; p.jitterY = Math.cos(t * 52) * 1.8 * k;
      p.eyeScale = 1.32; p.jawOpen = 0.72 * k + 0.18; p.pulse = 1 + 0.07 * k;
      break;
    }
    case 'happy':
      p.waveAmp = 0.19; p.waveFreq = 6.4; p.phase = t * 6.4;
      p.bobY = -Math.abs(Math.sin(t * 6.2)) * 2.6;
      p.jawOpen = 0.22 + Math.sin(t * 6.2) * 0.08;
      p.ruffleAmp = 4.2;
      break;
    case 'sad':
      p.waveAmp = 0.04; p.waveFreq = 1.4; p.phase = t * 1.4;
      p.jawOpen = 0.05; p.bobY = 1.6 + Math.sin(t * 1.6) * 0.8;
      break;
  }
  return p;
}

function blendPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], t);
  return out;
}

export class Morayeelfish {
  static metadata = {
    name: 'Green Moray Eel',
    category: 'fish',
    baseLength: 195,
    baseWidth: 34
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = sampleMorayPose('breathing', 0);
    this._pose = { ...this._fromPose };
    this._listeners = new Map();
  }

  getState() { return this._state; }
  setAngle(radians) { if (Number.isFinite(radians)) this.angle = radians; }
  setDirection(dx, dy) {
    if (Number.isFinite(dx) && Number.isFinite(dy) && (dx !== 0 || dy !== 0)) {
      this.angle = Math.atan2(dy, dx);
    }
  }

  onFinished(name, callback) {
    const s = normalizeState(name);
    if (!s || typeof callback !== 'function') return;
    if (!this._listeners.has(s)) this._listeners.set(s, []);
    this._listeners.get(s).push(callback);
  }

  _emitFinished(state) {
    const list = this._listeners.get(state);
    if (!list) return;
    for (const cb of [...list]) { try { cb(state, this); } catch (_) {} }
  }

  play(name) {
    const next = normalizeState(name);
    if (!next || next === this._state) return false;
    if (!canTransition(this._state, next)) return false;
    if (!ONE_SHOTS[this._state]) this._prevState = this._state;
    this._fromPose = { ...this._pose };
    this._state = next;
    this._stateTime = 0;
    this._blendElapsed = 0;
    return true;
  }

  update(dt) {
    const step = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1);
    this._stateTime += step;
    this._totalTime += step;

    const dur = ONE_SHOTS[this._state];
    if (dur && this._stateTime >= dur) {
      const done = this._state;
      const ret = VALID_STATES.has(this._prevState) ? this._prevState : 'breathing';
      this._fromPose = { ...this._pose };
      this._state = ret;
      this._stateTime = 0;
      this._blendElapsed = 0;
      this._emitFinished(done);
    }

    const target = sampleMorayPose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      const k = easeCubic(this._blendElapsed / BLEND_TIME);
      this._pose = blendPose(this._fromPose, target, k);
    } else {
      this._pose = target;
    }
  }

  // 10-node undulating serpentine ribbon spine (+X nose -> -X tail tip)
  _computeSpine(pose) {
    const L = 195;
    const N = 10;
    const nodes = [];
    const widths = [9.5, 16.5, 17.0, 15.6, 14.0, 12.2, 10.2, 8.0, 5.4, 2.2];
    const headX = L * 0.44;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const x = headX - u * L * 0.96;
      // Traveling sinusoidal wave along the 10-node eel body
      const env = Math.pow(u, 1.15);
      const sway = Math.sin(pose.phase - u * 4.9) * pose.waveAmp * L * 0.56 * env;
      const turnCurve = pose.turn * L * 0.44 * u * u;
      const y = sway + turnCurve;
      nodes.push({ x, y, u, halfW: widths[i] * pose.pulse });
    }
    // Compute tangent normals
    for (let i = 0; i < N; i++) {
      const p0 = nodes[Math.max(0, i - 1)];
      const p1 = nodes[Math.min(N - 1, i + 1)];
      const dx = p0.x - p1.x;
      const dy = p0.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;
      nodes[i].tx = dx / len;
      nodes[i].ty = dy / len;
      nodes[i].nx = -dy / len;
      nodes[i].ny = dx / len;
    }
    return nodes;
  }

  _buildRibbonEdges(spine) {
    const left = [];
    const right = [];
    for (let i = 0; i < spine.length; i++) {
      const n = spine[i];
      left.push({ x: n.x + n.nx * n.halfW, y: n.y + n.ny * n.halfW });
      right.push({ x: n.x - n.nx * n.halfW, y: n.y - n.ny * n.halfW });
    }
    return { left, right };
  }

  _traceBodyPath(ctx, spine, edges) {
    const head = spine[0];
    const tail = spine[spine.length - 1];
    ctx.beginPath();
    // Rounded expressive moray snout tip
    ctx.moveTo(head.x + head.tx * 13, head.y + head.ty * 13);
    ctx.quadraticCurveTo(
      head.x + head.tx * 9 + head.nx * 10.5,
      head.y + head.ty * 9 + head.ny * 10.5,
      edges.left[0].x, edges.left[0].y
    );
    for (let i = 1; i < edges.left.length; i++) {
      const prev = edges.left[i - 1];
      const cur = edges.left[i];
      ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + cur.x) * 0.5, (prev.y + cur.y) * 0.5);
    }
    const lastL = edges.left[edges.left.length - 1];
    const lastR = edges.right[edges.right.length - 1];
    ctx.lineTo(lastL.x, lastL.y);
    // Pointed ribbon tail fin tip
    ctx.quadraticCurveTo(tail.x - tail.tx * 12, tail.y - tail.ty * 12, lastR.x, lastR.y);
    for (let i = edges.right.length - 2; i >= 0; i--) {
      const prev = edges.right[i + 1];
      const cur = edges.right[i];
      ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + cur.x) * 0.5, (prev.y + cur.y) * 0.5);
    }
    ctx.lineTo(edges.right[0].x, edges.right[0].y);
    ctx.quadraticCurveTo(
      head.x + head.tx * 9 - head.nx * 10.5,
      head.y + head.ty * 9 - head.ny * 10.5,
      head.x + head.tx * 13, head.y + head.ty * 13
    );
    ctx.closePath();
  }

  _drawShadow(ctx, spine, edges) {
    ctx.save();
    ctx.translate(4, 7);
    this._traceBodyPath(ctx, spine, edges);
    ctx.fillStyle = 'rgba(18, 38, 16, 0.22)';
    ctx.fill();
    ctx.restore();
  }

  _drawSnappingJaws(ctx, spine, pose) {
    const h = spine[0];
    const open = pose.jawOpen;
    if (open < 0.04) return;
    ctx.save();
    ctx.translate(h.x + h.tx * 9, h.y + h.ty * 9);
    ctx.rotate(Math.atan2(h.ty, h.tx));

    // Lower jaw peeking out forward-under with cute rosy inner mouth & cartoon teeth
    const jawLen = 6 + open * 11;
    const jawW = 6.2 + open * 2.4;

    // Inner mouth cavity
    ctx.beginPath();
    ctx.moveTo(-2, -jawW);
    ctx.quadraticCurveTo(jawLen + 4, 0, -2, jawW);
    ctx.closePath();
    const mouthGrad = ctx.createLinearGradient(-2, 0, jawLen + 3, 0);
    mouthGrad.addColorStop(0, '#7F1D3A');
    mouthGrad.addColorStop(0.6, '#E14A6B');
    mouthGrad.addColorStop(1, '#FF8FA8');
    ctx.fillStyle = mouthGrad;
    ctx.fill();
    ctx.strokeStyle = '#1B2E12';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Cute tiny cartoon fangs/teeth arranged along jaw rim
    const teethCount = 5;
    ctx.fillStyle = '#FFFDF5';
    ctx.strokeStyle = '#243B17';
    ctx.lineWidth = 1.0;
    for (let i = 0; i < teethCount; i++) {
      const f = (i / (teethCount - 1)) * 2 - 1; // -1 to 1
      const tx = (1 - f * f * 0.72) * (jawLen - 0.5) + 1.5;
      const ty = f * (jawW * 0.82);
      ctx.beginPath();
      ctx.moveTo(tx - 1.8, ty - 1.3);
      ctx.lineTo(tx + 2.4, ty * 0.72);
      ctx.lineTo(tx - 1.8, ty + 1.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawBody(ctx, spine, edges, pose) {
    const h = spine[0];
    const t = spine[spine.length - 1];

    // Base lime-green to deep olive multi-stop gradient
    this._traceBodyPath(ctx, spine, edges);
    const bodyGrad = ctx.createLinearGradient(h.x + 15, h.y - 16, t.x - 10, t.y + 16);
    bodyGrad.addColorStop(0, '#B5E847');
    bodyGrad.addColorStop(0.28, '#8CC92E');
    bodyGrad.addColorStop(0.68, '#5E9822');
    bodyGrad.addColorStop(1, '#3D6B18');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Clip interior for layered cel-shading, mottled olive camouflage & glossy highlight
    ctx.save();
    this._traceBodyPath(ctx, spine, edges);
    ctx.clip();

    // Darker olive-emerald flank cel-shadow along lower/outer rims
    ctx.beginPath();
    ctx.moveTo(edges.right[0].x, edges.right[0].y);
    for (let i = 1; i < edges.right.length; i++) {
      ctx.lineTo(edges.right[i].x, edges.right[i].y);
    }
    for (let i = spine.length - 1; i >= 0; i--) {
      const n = spine[i];
      ctx.lineTo(n.x - n.nx * n.halfW * 0.32, n.y - n.ny * n.halfW * 0.32);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(34, 72, 16, 0.34)';
    ctx.fill();

    // Bright chartreuse-yellow belly rim glow on opposite side
    ctx.beginPath();
    ctx.moveTo(edges.left[0].x, edges.left[0].y);
    for (let i = 1; i < edges.left.length; i++) {
      ctx.lineTo(edges.left[i].x, edges.left[i].y);
    }
    for (let i = spine.length - 1; i >= 0; i--) {
      const n = spine[i];
      ctx.lineTo(n.x + n.nx * n.halfW * 0.55, n.y + n.ny * n.halfW * 0.55);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(218, 248, 108, 0.28)';
    ctx.fill();

    // Organic moray mucus-sheen mottled spots along flanks
    for (let i = 1; i < spine.length - 1; i++) {
      const n = spine[i];
      const r1 = n.halfW * 0.36;
      const r2 = n.halfW * 0.26;
      const sgn = i % 2 === 0 ? 1 : -1;
      ctx.fillStyle = 'rgba(54, 96, 20, 0.32)';
      ctx.beginPath();
      ctx.ellipse(n.x + n.nx * n.halfW * 0.46 * sgn, n.y + n.ny * n.halfW * 0.46 * sgn, r1 * 1.4, r1 * 0.78, Math.atan2(n.ty, n.tx), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(220, 255, 115, 0.28)';
      ctx.beginPath();
      ctx.ellipse(n.x - n.nx * n.halfW * 0.38 * sgn, n.y - n.ny * n.halfW * 0.38 * sgn, r2 * 1.3, r2 * 0.72, Math.atan2(n.ty, n.tx), 0, Math.PI * 2);
      ctx.fill();
    }

    // Glossy jelly-bean dorsal specular highlight on plump head/neck
    const n1 = spine[1];
    ctx.save();
    ctx.translate(n1.x + n1.nx * 3.5, n1.y + n1.ny * 3.5);
    ctx.rotate(Math.atan2(n1.ty, n1.tx));
    ctx.fillStyle = 'rgba(255, 255, 240, 0.46)';
    ctx.beginPath();
    ctx.ellipse(2, 0, 14, 4.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.beginPath();
    ctx.ellipse(10, -1, 4.2, 1.8, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Gill pore openings (distinctive round moray eel gill holes behind head)
    const g = spine[2];
    for (const side of [-1, 1]) {
      const gx = g.x + g.nx * g.halfW * 0.78 * side;
      const gy = g.y + g.ny * g.halfW * 0.78 * side;
      ctx.fillStyle = '#1D3311';
      ctx.beginPath();
      ctx.ellipse(gx, gy, 3.2 + pose.gillFlare * 2.2, 1.8 + pose.gillFlare * 1.1, Math.atan2(g.ty, g.tx) + side * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Tapered bold chibi ink outline
    this._traceBodyPath(ctx, spine, edges);
    ctx.strokeStyle = '#1B2F11';
    ctx.lineWidth = 3.0;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Cute tubular moray nostrils on snout tip
    for (const side of [-1, 1]) {
      const nx = h.x + h.tx * 7.5 + h.nx * 4.5 * side;
      const ny = h.y + h.ty * 7.5 + h.ny * 4.5 * side;
      ctx.fillStyle = '#D9F970';
      ctx.strokeStyle = '#1B2F11';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(nx, ny, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  _drawRuffledDorsalRidge(ctx, spine, pose) {
    // Continuous ruffled translucent yellow-lime dorsal fin ridge running from behind head to tail tip
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const pts = [];
    for (let i = 1; i < spine.length; i++) {
      const n = spine[i];
      const ruffle = Math.sin(this._totalTime * 6.5 - i * 1.15) * pose.ruffleAmp * (0.45 + n.u * 0.75);
      pts.push({
        bx: n.x,
        by: n.y,
        rx: n.x + n.nx * ruffle,
        ry: n.y + n.ny * ruffle
      });
    }

    // Translucent fin membrane ribbon
    ctx.beginPath();
    ctx.moveTo(pts[0].bx, pts[0].by);
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1], p1 = pts[i];
      ctx.quadraticCurveTo(p0.rx, p0.ry, (p0.rx + p1.rx) * 0.5, (p0.ry + p1.ry) * 0.5);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.rx - spine[spine.length - 1].tx * 7, last.ry - spine[spine.length - 1].ty * 7);
    for (let i = pts.length - 1; i >= 0; i--) {
      ctx.lineTo(pts[i].bx, pts[i].by);
    }
    ctx.closePath();
    const finGrad = ctx.createLinearGradient(pts[0].bx, pts[0].by, last.bx, last.by);
    finGrad.addColorStop(0, 'rgba(214, 249, 89, 0.88)');
    finGrad.addColorStop(0.55, 'rgba(156, 219, 48, 0.82)');
    finGrad.addColorStop(1, 'rgba(104, 166, 32, 0.78)');
    ctx.fillStyle = finGrad;
    ctx.fill();

    // Fine fin rays along the ruffled ridge
    ctx.strokeStyle = 'rgba(42, 78, 16, 0.42)';
    ctx.lineWidth = 1.1;
    for (let i = 0; i < pts.length; i++) {
      ctx.beginPath();
      ctx.moveTo(pts[i].bx, pts[i].by);
      ctx.lineTo(pts[i].rx, pts[i].ry);
      ctx.stroke();
    }

    // Bold ruffled crest outline
    ctx.beginPath();
    ctx.moveTo(pts[0].bx, pts[0].by);
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1], p1 = pts[i];
      ctx.quadraticCurveTo(p0.rx, p0.ry, (p0.rx + p1.rx) * 0.5, (p0.ry + p1.ry) * 0.5);
    }
    ctx.lineTo(last.rx, last.ry);
    ctx.strokeStyle = '#1B2F11';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.strokeStyle = '#E4FF80';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.restore();
  }

  _drawCheeksAndEyes(ctx, spine, pose) {
    const h = spine[0];
    const headAngle = Math.atan2(h.ty, h.tx);
    const st = this._state;

    // Rosy chibi cheek blushes behind eyes
    ctx.save();
    for (const side of [-1, 1]) {
      const cx = h.x - h.tx * 7.5 + h.nx * 10.2 * side;
      const cy = h.y - h.ty * 7.5 + h.ny * 10.2 * side;
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 118, 148, 0.56)' : 'rgba(255, 134, 152, 0.36)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 4.4, 2.5, headAngle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Oversized glossy chibi eyes (golden-amber moray iris glow!)
    for (const side of [-1, 1]) {
      const ex = h.x - h.tx * 1.2 + h.nx * 8.4 * side;
      const ey = h.y - h.ty * 1.2 + h.ny * 8.4 * side;
      const r = 5.4 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(headAngle);

      if (st === 'happy') {
        // ^ ^ joyful smiling chibi eyes
        ctx.strokeStyle = '#1B2F11';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 1.5, r * 0.72, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      } else if (st === 'stress') {
        // > < scrunched stressed eyes
        ctx.strokeStyle = '#1B2F11';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.2, -3.2 * side);
        ctx.lineTo(2.4, 0);
        ctx.lineTo(-3.2, 3.2 * side);
        ctx.stroke();
      } else {
        // Glossy sclera + golden-amber iris + deep pupil + dual catchlights
        ctx.fillStyle = '#FFFDF5';
        ctx.strokeStyle = '#1B2F11';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : (st === 'fear' ? r * 0.52 : r * 0.72);
        const irisGrad = ctx.createRadialGradient(0.5, 0, 0.5, 0, 0, irisR);
        irisGrad.addColorStop(0, '#FFE066');
        irisGrad.addColorStop(0.65, '#F59E0B');
        irisGrad.addColorStop(1, '#92400E');
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.arc(0.9, 0, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pupilR = st === 'shock' ? r * 0.24 : (st === 'fear' ? r * 0.30 : r * 0.44);
        ctx.fillStyle = '#151A12';
        ctx.beginPath();
        ctx.arc(1.1, 0, pupilR, 0, Math.PI * 2);
        ctx.fill();

        // Dual specular catchlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.3, -1.6 * side, r * 0.26, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-0.9, 1.5 * side, r * 0.13, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'hungry') {
          // Starry sparkle overlay in eyes
          ctx.fillStyle = '#FFF7AE';
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const ang = (k * Math.PI) / 4 + this._totalTime * 4;
            const rad = k % 2 === 0 ? r * 0.52 : r * 0.2;
            const sx = 0.8 + Math.cos(ang) * rad;
            const sy = Math.sin(ang) * rad;
            if (k === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
          }
          ctx.closePath();
          ctx.fill();
        } else if (st === 'relax') {
          // Peaceful sleepy half-closed eyelid
          ctx.fillStyle = '#9CD836';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#1B2F11';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-r, 0.4);
          ctx.quadraticCurveTo(0, 2.2, r, 0.4);
          ctx.stroke();
        } else if (st === 'sad' || st === 'fear') {
          // Watery teary shimmer at eye rim
          ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
          ctx.beginPath();
          ctx.ellipse(-1.4, 2.4 * side, 2.6, 1.6, 0.3 * side, 0, Math.PI * 2);
          ctx.fill();
          if (st === 'sad') {
            ctx.strokeStyle = '#1B2F11';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(-r * 0.9, -r * 0.5 * side);
            ctx.lineTo(r * 0.8, -r * 0.85 * side);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    // Dynamic mood emotes floating beside head
    this._drawEmote(ctx, h);
  }

  _drawEmote(ctx, h) {
    const st = this._state;
    if (st !== 'happy' && st !== 'shock' && st !== 'fear' && st !== 'stress' && st !== 'hungry') return;
    ctx.save();
    ctx.translate(h.x + h.tx * 14, h.y + h.ty * 14 - 18);
    if (st === 'happy' || st === 'hungry') {
      const pulse = 1 + Math.sin(this._totalTime * 7) * 0.16;
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#FDE047';
      ctx.strokeStyle = '#92400E';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? 6.5 : 2.5;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (st === 'shock') {
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#1B2F11';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-2.4, -11); ctx.lineTo(2.4, -11); ctx.lineTo(1.7, -1); ctx.lineTo(-1.7, -1); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 3.2, 2.3, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    } else if (st === 'fear' || st === 'stress') {
      ctx.fillStyle = '#38BDF8';
      ctx.strokeStyle = '#0369A1';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.quadraticCurveTo(5, 1, 0, 5.5);
      ctx.quadraticCurveTo(-5, 1, 0, -7);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  draw(ctx) {
    if (!ctx) return;
    const pose = this._pose;
    const spine = this._computeSpine(pose);
    const edges = this._buildRibbonEdges(spine);

    ctx.save();
    ctx.translate(this.x + pose.jitterX, this.y + pose.jitterY + pose.bobY);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    this._drawShadow(ctx, spine, edges);
    this._drawSnappingJaws(ctx, spine, pose);
    this._drawBody(ctx, spine, edges, pose);
    this._drawRuffledDorsalRidge(ctx, spine, pose);
    this._drawCheeksAndEyes(ctx, spine, pose);

    ctx.restore();
  }
}

export default Morayeelfish;
