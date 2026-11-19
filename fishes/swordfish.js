/**
 * Broadbill Swordfish (Swordfish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 210x68px
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

function sampleSwordPose(state, t) {
  const p = {
    waveAmp: 0.035, waveFreq: 2.6, phase: t * 2.6, turn: 0,
    tailWag: 0, pecSweep: 0, dorsalTilt: 0, jawOpen: 0,
    eyeScale: 1, pulse: 1, jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.waveAmp = 0.03; p.waveFreq = 2.2; p.phase = t * 2.2;
      p.pecSweep = Math.sin(t * 2.2) * 0.08;
      p.pulse = 1 + Math.sin(t * 2.4) * 0.024;
      break;
    case 'swimming':
      p.waveAmp = 0.13; p.waveFreq = 9.0; p.phase = t * 9.0;
      p.tailWag = Math.sin(t * 9.0) * 0.42;
      p.pecSweep = -0.22 + Math.sin(t * 9.0) * 0.08;
      p.dorsalTilt = Math.sin(t * 9.0) * 3.5;
      break;
    case 'relax':
      p.waveAmp = 0.02; p.waveFreq = 1.2; p.phase = t * 1.2;
      p.pecSweep = 0.12; p.bobY = Math.sin(t * 1.4) * 1.6;
      break;
    case 'left_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.left_turn, 0, 1) * Math.PI);
      p.waveAmp = 0.09; p.waveFreq = 6.5; p.phase = t * 6.5;
      p.turn = -0.28 * k; p.tailWag = -0.45 * k; p.dorsalTilt = -5 * k;
      break;
    }
    case 'right_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.right_turn, 0, 1) * Math.PI);
      p.waveAmp = 0.09; p.waveFreq = 6.5; p.phase = t * 6.5;
      p.turn = 0.28 * k; p.tailWag = 0.45 * k; p.dorsalTilt = 5 * k;
      break;
    }
    case 'eating': {
      const k = Math.sin(clamp(t / ONE_SHOTS.eating, 0, 1) * Math.PI);
      p.waveAmp = 0.11; p.waveFreq = 7.5; p.phase = t * 7.5;
      p.jawOpen = k * 0.85; p.pulse = 1 + k * 0.06;
      break;
    }
    case 'hungry':
      p.waveAmp = 0.10; p.waveFreq = 6.0; p.phase = t * 6.0;
      p.jawOpen = 0.22 + Math.abs(Math.sin(t * 8.5)) * 0.4;
      p.eyeScale = 1.12;
      break;
    case 'stress':
      p.waveAmp = 0.14; p.waveFreq = 12; p.phase = t * 12;
      p.jitterX = Math.sin(t * 44) * 1.4; p.jitterY = Math.cos(t * 40) * 1.2;
      break;
    case 'fear':
      p.waveAmp = 0.17; p.waveFreq = 15; p.phase = t * 15;
      p.jitterX = Math.sin(t * 52) * 1.9; p.jitterY = Math.cos(t * 48) * 1.6;
      p.eyeScale = 1.25; p.pecSweep = 0.3;
      break;
    case 'shock': {
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.waveAmp = 0.04; p.waveFreq = 16; p.phase = t * 16;
      p.jitterX = Math.sin(t * 58) * 2.3 * k; p.jitterY = Math.cos(t * 54) * 1.8 * k;
      p.eyeScale = 1.35; p.jawOpen = 0.55 * k; p.pecSweep = 0.35 * k;
      break;
    }
    case 'happy':
      p.waveAmp = 0.11; p.waveFreq = 6.8; p.phase = t * 6.8;
      p.bobY = -Math.abs(Math.sin(t * 6.2)) * 2.8;
      p.pecSweep = Math.sin(t * 7.0) * 0.22;
      break;
    case 'sad':
      p.waveAmp = 0.02; p.waveFreq = 1.3; p.phase = t * 1.3;
      p.pecSweep = -0.2; p.bobY = 1.8 + Math.sin(t * 1.6) * 0.8;
      break;
  }
  return p;
}

function blendPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], t);
  return out;
}

export class Swordfish {
  static metadata = {
    name: 'Broadbill Swordfish',
    category: 'fish',
    baseLength: 210,
    baseWidth: 68
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = sampleSwordPose('breathing', 0);
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

    const target = sampleSwordPose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _computeSpine(pose) {
    const L = 210;
    // Stout metallic torpedo body (+X nose at 42, flat broadsword extends to +106!)
    const xs = [42, 22, -2, -26, -50, -72, -88];
    const ws = [16.5, 25.0, 26.8, 22.0, 15.2, 8.8, 4.6];
    const nodes = [];
    for (let i = 0; i < xs.length; i++) {
      const u = i / (xs.length - 1);
      const env = Math.pow(u, 1.55);
      const y = Math.sin(pose.phase - u * 3.3) * pose.waveAmp * L * 0.42 * env + pose.turn * L * 0.32 * u * u;
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

  _drawBroadswordBill(ctx, spine) {
    const h = spine[0];
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(Math.atan2(h.ty, h.tx));

    // Long flat metallic broadsword bill (+64px)
    ctx.beginPath();
    ctx.moveTo(-2, -6.2);
    ctx.quadraticCurveTo(28, -4.2, 65, 0);
    ctx.quadraticCurveTo(28, 4.2, -2, 6.2);
    ctx.closePath();

    const billG = ctx.createLinearGradient(0, -6, 65, 6);
    billG.addColorStop(0, '#1E3A5F');
    billG.addColorStop(0.35, '#475569');
    billG.addColorStop(0.75, '#CBD5E1');
    billG.addColorStop(1, '#F8FAFC');
    ctx.fillStyle = billG;
    ctx.fill();

    // Central steel sword ridge bevel
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(4, -1.2);
    ctx.lineTo(59, 0);
    ctx.stroke();

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawScythePectorals(ctx, spine, pose) {
    const n = spine[1];
    const ang = Math.atan2(n.ty, n.tx);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(n.x + n.nx * n.halfW * 0.72 * side, n.y + n.ny * n.halfW * 0.72 * side);
      ctx.rotate(ang + pose.pecSweep * side);

      // Swept scythe pectoral fin
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.bezierCurveTo(-4, 24 * side, -22, 34 * side, -42, 30 * side);
      ctx.bezierCurveTo(-24, 22 * side, -16, 10 * side, -12, 0);
      ctx.closePath();

      const pg = ctx.createLinearGradient(0, 0, -38, 30 * side);
      pg.addColorStop(0, '#1E3A5F');
      pg.addColorStop(0.55, '#3B6496');
      pg.addColorStop(1, '#93C5FD');
      ctx.fillStyle = pg;
      ctx.fill();

      ctx.strokeStyle = 'rgba(224, 242, 254, 0.45)';
      ctx.lineWidth = 1.1;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-2 * i, 2 * side);
        ctx.quadraticCurveTo(-12 - i * 4, (12 + i * 4) * side, -34 + i * 3, (26 - i * 2) * side);
        ctx.stroke();
      }

      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.3;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawCrescentTail(ctx, spine, pose) {
    const tail = spine[spine.length - 1];
    const ang = Math.atan2(tail.ty, tail.tx) + pose.tailWag * 0.55;
    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(ang);

    // Caudal keels on tail peduncle
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(8, -4.5); ctx.lineTo(-2, -3.5);
    ctx.moveTo(8, 4.5); ctx.lineTo(-2, 3.5);
    ctx.stroke();

    // Heavy oceanic crescent tail
    ctx.beginPath();
    ctx.moveTo(2, -4.2);
    ctx.bezierCurveTo(-6, -18, -16, -32, -26, -35);
    ctx.bezierCurveTo(-20, -18, -14, -8, -10, 0);
    ctx.bezierCurveTo(-14, 8, -20, 18, -26, 35);
    ctx.bezierCurveTo(-16, 32, -6, 18, 2, 4.2);
    ctx.closePath();

    const tg = ctx.createLinearGradient(0, -34, -26, 34);
    tg.addColorStop(0, '#172554');
    tg.addColorStop(0.5, '#2E4F82');
    tg.addColorStop(1, '#172554');
    ctx.fillStyle = tg;
    ctx.fill();

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _traceBody(ctx, spine) {
    const h = spine[0];
    const tail = spine[spine.length - 1];
    ctx.beginPath();
    ctx.moveTo(h.x + h.tx * 12, h.y + h.ty * 12);
    ctx.quadraticCurveTo(h.x + h.tx * 6 + h.nx * 14, h.y + h.ty * 6 + h.ny * 14, spine[1].x + spine[1].nx * spine[1].halfW, spine[1].y + spine[1].ny * spine[1].halfW);
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
    ctx.quadraticCurveTo(h.x + h.tx * 6 - h.nx * 14, h.y + h.ty * 6 - h.ny * 14, h.x + h.tx * 12, h.y + h.ty * 12);
    ctx.closePath();
  }

  _drawBodyAndSickleDorsal(ctx, spine, pose) {
    // Drop shadow
    ctx.save();
    ctx.translate(4, 8);
    this._traceBody(ctx, spine);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.24)';
    ctx.fill();
    ctx.restore();

    // Stout metallic dark-blue body gradient
    this._traceBody(ctx, spine);
    const bg = ctx.createLinearGradient(45, -26, -85, 26);
    bg.addColorStop(0, '#3B5E94');
    bg.addColorStop(0.32, '#1E3A6D');
    bg.addColorStop(0.72, '#152A52');
    bg.addColorStop(1, '#0F1D3B');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    this._traceBody(ctx, spine);
    ctx.clip();

    // Silvery metallic flank shimmer bands
    ctx.fillStyle = 'rgba(186, 214, 248, 0.34)';
    ctx.beginPath(); ctx.ellipse(-10, -20, 62, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(148, 184, 224, 0.28)';
    ctx.beginPath(); ctx.ellipse(-10, 20, 62, 10, 0, 0, Math.PI * 2); ctx.fill();

    // Glossy jelly-bean chibi highlight on stout shoulders
    ctx.fillStyle = 'rgba(224, 242, 254, 0.42)';
    ctx.beginPath(); ctx.ellipse(12, -8, 22, 6.5, -0.05, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.beginPath(); ctx.ellipse(26, -9, 5.5, 2.2, -0.1, 0, Math.PI * 2); ctx.fill();

    ctx.restore();

    // Bold chibi outline
    this._traceBody(ctx, spine);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Tall sickle dorsal fin viewed from top-down (sweeping curved fin crest)
    const d0 = spine[1], d1 = spine[2], d2 = spine[3];
    const tilt = pose.dorsalTilt;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(d0.x + 2, d0.y);
    ctx.bezierCurveTo(d1.x + 8, d1.y + 11 + tilt, d1.x - 14, d1.y + 15 + tilt * 1.4, d2.x - 12, d2.y + 6 + tilt);
    ctx.quadraticCurveTo(d1.x - 6, d1.y + 2 + tilt * 0.4, d0.x - 16, d0.y);
    ctx.closePath();
    const dg = ctx.createLinearGradient(d0.x, d0.y, d2.x - 12, d2.y + 14);
    dg.addColorStop(0, '#1D4ED8');
    dg.addColorStop(0.6, '#1E3A8A');
    dg.addColorStop(1, '#60A5FA');
    ctx.fillStyle = dg;
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawEyesAndEmote(ctx, spine, pose) {
    const h = spine[0];
    const headAngle = Math.atan2(h.ty, h.tx);
    const st = this._state;

    // Rosy cheek blushes
    for (const side of [-1, 1]) {
      const cx = h.x - h.tx * 9 + h.nx * 17.5 * side;
      const cy = h.y - h.ty * 9 + h.ny * 17.5 * side;
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 118, 152, 0.55)' : 'rgba(255, 138, 162, 0.36)';
      ctx.beginPath(); ctx.ellipse(cx, cy, 5.2, 3.0, headAngle, 0, Math.PI * 2); ctx.fill();
    }

    // Oversized glossy deep-sea sapphire chibi eyes
    for (const side of [-1, 1]) {
      const ex = h.x - h.tx * 1 + h.nx * 13.5 * side;
      const ey = h.y - h.ty * 1 + h.ny * 13.5 * side;
      const r = 6.8 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(headAngle);
      if (st === 'happy') {
        ctx.strokeStyle = '#0F172A'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 1.5, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#0F172A'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-3.6, -3.6 * side); ctx.lineTo(2.6, 0); ctx.lineTo(-3.6, 3.6 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#F8FAFC'; ctx.strokeStyle = '#0F172A'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.4 : (st === 'fear' ? r * 0.5 : r * 0.74);
        const ig = ctx.createRadialGradient(0.5, 0, 0.5, 0, 0, ir);
        ig.addColorStop(0, '#7DD3FC'); ig.addColorStop(0.65, '#0284C7'); ig.addColorStop(1, '#1E3A8A');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(1.0, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.22 : (st === 'fear' ? r * 0.28 : r * 0.44);
        ctx.fillStyle = '#090E1A';
        ctx.beginPath(); ctx.arc(1.2, 0, pr, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(2.8, -2.0 * side, r * 0.27, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-1.1, 1.8 * side, r * 0.14, 0, Math.PI * 2); ctx.fill();

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
          ctx.fillStyle = '#2A4A82';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#0F172A'; ctx.lineWidth = 1.9;
          ctx.beginPath(); ctx.moveTo(-r, 0.4); ctx.quadraticCurveTo(0, 2.4, r, 0.4); ctx.stroke();
        } else if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.88)';
          ctx.beginPath(); ctx.ellipse(-1.5, 2.8 * side, 2.9, 1.8, 0.3 * side, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'happy' || st === 'hungry' || st === 'shock' || st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(h.x + 12, h.y - 26);
      if (st === 'happy' || st === 'hungry') {
        ctx.fillStyle = '#FDE047'; ctx.strokeStyle = '#92400E'; ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4; const rad = i % 2 === 0 ? 7 : 2.8;
          if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
          else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (st === 'shock') {
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#0F172A'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-2.5, -12); ctx.lineTo(2.5, -12); ctx.lineTo(1.8, -1); ctx.lineTo(-1.8, -1); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 3.5, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillStyle = '#38BDF8'; ctx.strokeStyle = '#0369A1'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(0, -7.5); ctx.quadraticCurveTo(5.2, 1, 0, 5.8); ctx.quadraticCurveTo(-5.2, 1, 0, -7.5); ctx.closePath();
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

    this._drawScythePectorals(ctx, spine, pose);
    this._drawCrescentTail(ctx, spine, pose);
    this._drawBroadswordBill(ctx, spine);
    this._drawBodyAndSickleDorsal(ctx, spine, pose);
    this._drawEyesAndEmote(ctx, spine, pose);

    ctx.restore();
  }
}

export default Swordfish;
