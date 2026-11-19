/**
 * Northern Pike (Northernpikefish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 155x42px
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

function samplePikePose(state, t) {
  const p = {
    waveAmp: 0.05, waveFreq: 2.4, phase: t * 2.4, turn: 0,
    tailWag: 0, pecSweep: 0, gillFlare: 0.08, jawOpen: 0,
    eyeScale: 1, pulse: 1, jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.waveAmp = 0.035; p.waveFreq = 2.0; p.phase = t * 2.0;
      p.pecSweep = Math.sin(t * 2.2) * 0.14;
      p.gillFlare = 0.12 + Math.sin(t * 2.4) * 0.1;
      p.pulse = 1 + Math.sin(t * 2.4) * 0.025;
      break;
    case 'swimming':
      p.waveAmp = 0.16; p.waveFreq = 8.0; p.phase = t * 8.0;
      p.tailWag = Math.sin(t * 8.0) * 0.35;
      p.pecSweep = -0.35 + Math.sin(t * 8.0) * 0.12;
      break;
    case 'relax':
      p.waveAmp = 0.025; p.waveFreq = 1.2; p.phase = t * 1.2;
      p.pecSweep = 0.18 + Math.sin(t * 1.4) * 0.06;
      p.bobY = Math.sin(t * 1.4) * 1.5;
      break;
    case 'left_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.left_turn, 0, 1) * Math.PI);
      p.waveAmp = 0.10; p.waveFreq = 6.0; p.phase = t * 6.0;
      p.turn = -0.30 * k; p.tailWag = -0.42 * k; p.pecSweep = 0.25 * k;
      break;
    }
    case 'right_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.right_turn, 0, 1) * Math.PI);
      p.waveAmp = 0.10; p.waveFreq = 6.0; p.phase = t * 6.0;
      p.turn = 0.30 * k; p.tailWag = 0.42 * k; p.pecSweep = 0.25 * k;
      break;
    }
    case 'eating': {
      const k = Math.sin(clamp(t / ONE_SHOTS.eating, 0, 1) * Math.PI);
      p.waveAmp = 0.12; p.waveFreq = 7.0; p.phase = t * 7.0;
      p.jawOpen = k * 0.9; p.pulse = 1 + k * 0.06;
      break;
    }
    case 'hungry':
      p.waveAmp = 0.11; p.waveFreq = 5.5; p.phase = t * 5.5;
      p.jawOpen = 0.25 + Math.abs(Math.sin(t * 8.5)) * 0.45;
      p.eyeScale = 1.12;
      break;
    case 'stress':
      p.waveAmp = 0.14; p.waveFreq = 11.5; p.phase = t * 11.5;
      p.jitterX = Math.sin(t * 44) * 1.3; p.jitterY = Math.cos(t * 39) * 1.2;
      p.gillFlare = 0.3;
      break;
    case 'fear':
      p.waveAmp = 0.18; p.waveFreq = 14.5; p.phase = t * 14.5;
      p.jitterX = Math.sin(t * 52) * 1.8; p.jitterY = Math.cos(t * 47) * 1.6;
      p.eyeScale = 1.24; p.pecSweep = 0.38;
      break;
    case 'shock': {
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.waveAmp = 0.04; p.waveFreq = 15; p.phase = t * 15;
      p.jitterX = Math.sin(t * 56) * 2.1 * k; p.jitterY = Math.cos(t * 50) * 1.7 * k;
      p.eyeScale = 1.34; p.jawOpen = 0.55 * k; p.pecSweep = 0.45 * k;
      break;
    }
    case 'happy':
      p.waveAmp = 0.13; p.waveFreq = 6.5; p.phase = t * 6.5;
      p.bobY = -Math.abs(Math.sin(t * 6.0)) * 2.5;
      p.pecSweep = Math.sin(t * 7.0) * 0.28;
      break;
    case 'sad':
      p.waveAmp = 0.02; p.waveFreq = 1.3; p.phase = t * 1.3;
      p.pecSweep = -0.25; p.bobY = 1.6 + Math.sin(t * 1.5) * 0.8;
      break;
  }
  return p;
}

function blendPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], t);
  return out;
}

export class Northernpikefish {
  static metadata = {
    name: 'Northern Pike',
    category: 'fish',
    baseLength: 155,
    baseWidth: 42
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = samplePikePose('breathing', 0);
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

    const target = samplePikePose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _computeSpine(pose) {
    const L = 155;
    // Ambush torpedo chibi profile: broad duck-bill snout -> plump shoulders -> sleek rear
    const xs = [58, 38, 16, -6, -28, -48, -64];
    const ws = [11.5, 19.5, 20.8, 18.2, 13.8, 8.6, 5.0];
    const nodes = [];
    for (let i = 0; i < xs.length; i++) {
      const u = i / (xs.length - 1);
      const env = Math.pow(u, 1.45);
      const y = Math.sin(pose.phase - u * 3.4) * pose.waveAmp * L * 0.5 * env + pose.turn * L * 0.36 * u * u;
      nodes.push({ x: xs[i], y, u, halfW: ws[i] * pose.pulse });
    }
    for (let i = 0; i < nodes.length; i++) {
      const p0 = nodes[Math.max(0, i - 1)];
      const p1 = nodes[Math.min(nodes.length - 1, i + 1)];
      const dx = p0.x - p1.x, dy = p0.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;
      nodes[i].tx = dx / len; nodes[i].ty = dy / len;
      nodes[i].nx = -dy / len; nodes[i].ny = dx / len;
    }
    return nodes;
  }

  _tracePikeBody(ctx, spine) {
    const n0 = spine[0];
    const tail = spine[spine.length - 1];
    ctx.beginPath();
    // Broad flat duck-bill snout tip
    ctx.moveTo(n0.x + n0.tx * 18, n0.y + n0.ty * 18);
    ctx.bezierCurveTo(
      n0.x + n0.tx * 17 + n0.nx * 10.5, n0.y + n0.ty * 17 + n0.ny * 10.5,
      n0.x + n0.tx * 6 + n0.nx * 12.0, n0.y + n0.ty * 6 + n0.ny * 12.0,
      spine[1].x + spine[1].nx * spine[1].halfW, spine[1].y + spine[1].ny * spine[1].halfW
    );
    for (let i = 2; i < spine.length; i++) {
      const prev = spine[i - 1], cur = spine[i];
      ctx.quadraticCurveTo(
        prev.x + prev.nx * prev.halfW, prev.y + prev.ny * prev.halfW,
        (prev.x + cur.x) * 0.5 + (prev.nx * prev.halfW + cur.nx * cur.halfW) * 0.5,
        (prev.y + cur.y) * 0.5 + (prev.ny * prev.halfW + cur.ny * cur.halfW) * 0.5
      );
    }
    ctx.lineTo(tail.x + tail.nx * tail.halfW, tail.y + tail.ny * tail.halfW);
    ctx.lineTo(tail.x - tail.nx * tail.halfW, tail.y - tail.ny * tail.halfW);
    for (let i = spine.length - 2; i >= 1; i--) {
      const prev = spine[i + 1], cur = spine[i];
      ctx.quadraticCurveTo(
        prev.x - prev.nx * prev.halfW, prev.y - prev.ny * prev.halfW,
        (prev.x + cur.x) * 0.5 - (prev.nx * prev.halfW + cur.nx * cur.halfW) * 0.5,
        (prev.y + cur.y) * 0.5 - (prev.ny * prev.halfW + cur.ny * cur.halfW) * 0.5
      );
    }
    ctx.bezierCurveTo(
      n0.x + n0.tx * 6 - n0.nx * 12.0, n0.y + n0.ty * 6 - n0.ny * 12.0,
      n0.x + n0.tx * 17 - n0.nx * 10.5, n0.y + n0.ty * 17 - n0.ny * 10.5,
      n0.x + n0.tx * 18, n0.y + n0.ty * 18
    );
    ctx.closePath();
  }

  _drawMottledFin(ctx, x, y, angle, len, wid, side) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.45, wid * side * 1.15, len, wid * side * 0.42);
    ctx.quadraticCurveTo(len * 0.72, -wid * side * 0.15, 0, 0);
    ctx.closePath();

    const g = ctx.createLinearGradient(0, 0, len, wid * side);
    g.addColorStop(0, 'rgba(218, 132, 72, 0.88)');
    g.addColorStop(0.55, 'rgba(184, 88, 48, 0.82)');
    g.addColorStop(1, 'rgba(116, 48, 28, 0.75)');
    ctx.fillStyle = g;
    ctx.fill();

    // Dark pike fin mottling bars
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(42, 26, 16, 0.38)';
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.ellipse(len * (0.24 * i), wid * side * 0.45, 2.2, wid * 0.45, 0.25 * side, 0, Math.PI * 2);
      ctx.fill();
    }
    // Translucent fin rays
    ctx.strokeStyle = 'rgba(255, 224, 180, 0.45)';
    ctx.lineWidth = 1.0;
    for (let r = 0.2; r <= 0.8; r += 0.2) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len * 0.9, wid * side * r);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = '#1B2814';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.restore();
  }

  _drawTailFin(ctx, spine, pose) {
    const tail = spine[spine.length - 1];
    const ang = Math.atan2(tail.ty, tail.tx) + pose.tailWag * 0.55;
    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(ang);

    // Broad forked mottled reddish-amber pike caudal fin
    ctx.beginPath();
    ctx.moveTo(2, -4.5);
    ctx.quadraticCurveTo(-12, -16, -26, -18.5);
    ctx.quadraticCurveTo(-22, -6, -15, 0);
    ctx.quadraticCurveTo(-22, 6, -26, 18.5);
    ctx.quadraticCurveTo(-12, 16, 2, 4.5);
    ctx.closePath();

    const tg = ctx.createLinearGradient(0, 0, -26, 0);
    tg.addColorStop(0, '#A86E34');
    tg.addColorStop(0.55, '#C8643B');
    tg.addColorStop(1, '#8C3824');
    ctx.fillStyle = tg;
    ctx.fill();

    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(34, 22, 14, 0.42)';
    for (const bx of [-10, -18]) {
      for (const by of [-10, 0, 10]) {
        ctx.beginPath();
        ctx.ellipse(bx, by, 2.8, 4.4, 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.strokeStyle = 'rgba(255, 225, 185, 0.42)';
    ctx.lineWidth = 1.0;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-24, i * 5.2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = '#1B2814';
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawBodyAndBeanSpots(ctx, spine, pose) {
    // Drop shadow
    ctx.save();
    ctx.translate(4, 7);
    this._tracePikeBody(ctx, spine);
    ctx.fillStyle = 'rgba(18, 32, 16, 0.22)';
    ctx.fill();
    ctx.restore();

    // Olive-green ambush predator base gradient
    this._tracePikeBody(ctx, spine);
    const g = ctx.createLinearGradient(70, -22, -65, 22);
    g.addColorStop(0, '#88A842');
    g.addColorStop(0.35, '#5C822C');
    g.addColorStop(0.75, '#3E6020');
    g.addColorStop(1, '#2D4818');
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    this._tracePikeBody(ctx, spine);
    ctx.clip();

    // Layered cel-shading along flanks
    const mid = spine[2];
    ctx.fillStyle = 'rgba(22, 44, 12, 0.34)';
    ctx.beginPath();
    ctx.ellipse(-6, 15, 68, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Signature Northern Pike horizontal rows of golden bean-shaped spots across flanks!
    const beanRows = [
      { idx: 1, off: 0.56, rx: 4.8, ry: 2.3 },
      { idx: 2, off: 0.62, rx: 5.8, ry: 2.6 },
      { idx: 2, off: 0.25, rx: 4.5, ry: 2.0 },
      { idx: 3, off: 0.60, rx: 5.6, ry: 2.5 },
      { idx: 3, off: 0.24, rx: 4.6, ry: 2.1 },
      { idx: 4, off: 0.58, rx: 5.0, ry: 2.3 },
      { idx: 4, off: 0.22, rx: 4.0, ry: 1.9 },
      { idx: 5, off: 0.54, rx: 4.2, ry: 1.9 }
    ];
    for (const b of beanRows) {
      const n = spine[b.idx];
      const ang = Math.atan2(n.ty, n.tx);
      for (const side of [-1, 1]) {
        const bx = n.x + n.nx * n.halfW * b.off * side;
        const by = n.y + n.ny * n.halfW * b.off * side;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(ang);
        ctx.fillStyle = '#F7DF84';
        ctx.beginPath();
        ctx.ellipse(0, 0, b.rx, b.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 252, 224, 0.65)';
        ctx.beginPath();
        ctx.ellipse(b.rx * 0.22, -b.ry * 0.2, b.rx * 0.45, b.ry * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Glossy jelly-bean dorsal highlight on shoulders & duck-bill bridge
    ctx.save();
    ctx.translate(mid.x + 8, mid.y - 4);
    ctx.rotate(Math.atan2(mid.ty, mid.tx));
    ctx.fillStyle = 'rgba(244, 255, 200, 0.38)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 6.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 245, 0.62)';
    ctx.beginPath();
    ctx.ellipse(15, -1.5, 5.5, 2.2, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Gill covers (flared opercula)
    const gNode = spine[1];
    ctx.strokeStyle = '#233B14';
    ctx.lineWidth = 2.0;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(gNode.x - 4 + gNode.nx * 12 * side, gNode.y + gNode.ny * 12 * side, 7.5 + pose.gillFlare * 3, (side > 0 ? 0.35 : -1.55), (side > 0 ? 1.55 : -0.35));
      ctx.stroke();
    }
    ctx.restore();

    // Bold chibi outline
    this._tracePikeBody(ctx, spine);
    ctx.strokeStyle = '#1B2814';
    ctx.lineWidth = 3.0;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Duck-bill jaw seam & ambush mouth when snapping
    const n0 = spine[0];
    if (pose.jawOpen > 0.08) {
      ctx.save();
      ctx.translate(n0.x + n0.tx * 16, n0.y + n0.ty * 16);
      ctx.rotate(Math.atan2(n0.ty, n0.tx));
      ctx.fillStyle = '#E04D6A';
      ctx.strokeStyle = '#1B2814';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(2 + pose.jawOpen * 5, 0, 5 + pose.jawOpen * 5, 5.5 + pose.jawOpen * 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawRearDorsalFin(ctx, spine, pose) {
    // Signature Northern Pike rear-set mottled dorsal fin (near node 4-5)
    const n4 = spine[4], n5 = spine[5];
    const wag = pose.tailWag * 9;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(n4.x + 5, n4.y);
    ctx.quadraticCurveTo((n4.x + n5.x) * 0.5, (n4.y + n5.y) * 0.5 + wag, n5.x - 6, n5.y + wag * 1.15);
    ctx.strokeStyle = '#1B2814';
    ctx.lineWidth = 6.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = '#CE6D3E';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();
  }

  _drawEyesAndEmote(ctx, spine, pose) {
    const n0 = spine[0];
    const headAngle = Math.atan2(n0.ty, n0.tx);
    const st = this._state;

    // Rosy cheek blushes
    for (const side of [-1, 1]) {
      const cx = n0.x - n0.tx * 8 + n0.nx * 13.5 * side;
      const cy = n0.y - n0.ty * 8 + n0.ny * 13.5 * side;
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 118, 148, 0.52)' : 'rgba(255, 138, 152, 0.34)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 4.6, 2.7, headAngle, 0, Math.PI * 2);
      ctx.fill();
    }

    // Expressive chibi golden-yellow pike eyes
    for (const side of [-1, 1]) {
      const ex = n0.x - n0.tx * 2 + n0.nx * 10.6 * side;
      const ey = n0.y - n0.ty * 2 + n0.ny * 10.6 * side;
      const r = 5.8 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(headAngle);

      if (st === 'happy') {
        ctx.strokeStyle = '#1B2814'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 1.5, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#1B2814'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-3.2, -3.2 * side); ctx.lineTo(2.4, 0); ctx.lineTo(-3.2, 3.2 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFDF5'; ctx.strokeStyle = '#1B2814'; ctx.lineWidth = 2.0;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.4 : (st === 'fear' ? r * 0.5 : r * 0.72);
        const ig = ctx.createRadialGradient(0.5, 0, 0.5, 0, 0, ir);
        ig.addColorStop(0, '#FEF08A'); ig.addColorStop(0.7, '#D97706'); ig.addColorStop(1, '#78350F');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(0.9, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.22 : (st === 'fear' ? r * 0.28 : r * 0.44);
        ctx.fillStyle = '#141B10';
        ctx.beginPath(); ctx.arc(1.1, 0, pr, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(2.4, -1.7 * side, r * 0.26, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-0.9, 1.6 * side, r * 0.13, 0, Math.PI * 2); ctx.fill();

        if (st === 'hungry') {
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4 + this._totalTime * 4;
            const rad = k % 2 === 0 ? r * 0.52 : r * 0.2;
            if (k === 0) ctx.moveTo(0.8 + Math.cos(a) * rad, Math.sin(a) * rad);
            else ctx.lineTo(0.8 + Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath(); ctx.fill();
        } else if (st === 'relax') {
          ctx.fillStyle = '#6D9334';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#1B2814'; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.moveTo(-r, 0.4); ctx.quadraticCurveTo(0, 2.2, r, 0.4); ctx.stroke();
        } else if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
          ctx.beginPath(); ctx.ellipse(-1.4, 2.5 * side, 2.6, 1.6, 0.3 * side, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    // Emote bubble
    if (st === 'happy' || st === 'hungry' || st === 'shock' || st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(n0.x + 14, n0.y - 22);
      if (st === 'happy' || st === 'hungry') {
        ctx.fillStyle = '#FDE047'; ctx.strokeStyle = '#92400E'; ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4; const rad = i % 2 === 0 ? 6.5 : 2.5;
          if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
          else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (st === 'shock') {
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#1B2814'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-2.4, -11); ctx.lineTo(2.4, -11); ctx.lineTo(1.7, -1); ctx.lineTo(-1.7, -1); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 3.2, 2.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillStyle = '#38BDF8'; ctx.strokeStyle = '#0369A1'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(0, -7); ctx.quadraticCurveTo(5, 1, 0, 5.5); ctx.quadraticCurveTo(-5, 1, 0, -7); ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }
  }

  draw(ctx) {
    if (!ctx) return;
    const pose = this._pose;
    const spine = this._computeSpine(pose);

    ctx.save();
    ctx.translate(this.x + pose.jitterX, this.y + pose.jitterY + pose.bobY);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // Pectoral & rear-set pelvic mottled fins
    const pNode = spine[1], vNode = spine[3];
    const pAng = Math.atan2(pNode.ty, pNode.tx);
    const vAng = Math.atan2(vNode.ty, vNode.tx);
    for (const side of [-1, 1]) {
      this._drawMottledFin(ctx, pNode.x + pNode.nx * pNode.halfW * 0.72 * side, pNode.y + pNode.ny * pNode.halfW * 0.72 * side, pAng + Math.PI * 0.72 * side + pose.pecSweep * side, 22, 11, side);
      this._drawMottledFin(ctx, vNode.x + vNode.nx * vNode.halfW * 0.65 * side, vNode.y + vNode.ny * vNode.halfW * 0.65 * side, vAng + Math.PI * 0.76 * side, 16, 8.5, side);
    }

    this._drawTailFin(ctx, spine, pose);
    this._drawBodyAndBeanSpots(ctx, spine, pose);
    this._drawRearDorsalFin(ctx, spine, pose);
    this._drawEyesAndEmote(ctx, spine, pose);

    ctx.restore();
  }
}

export default Northernpikefish;
