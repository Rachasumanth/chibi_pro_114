/**
 * Ocean Sunfish (Sunfish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 230x165px
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

function sampleSunfishPose(state, t) {
  const p = {
    paddleSweep: 0, clavusWave: t * 2.2, turn: 0, lipPucker: 1.0,
    eyeScale: 1, pulse: 1, jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.paddleSweep = Math.sin(t * 1.8) * 0.18;
      p.clavusWave = t * 2.0;
      p.pulse = 1 + Math.sin(t * 2.0) * 0.02;
      break;
    case 'swimming':
      p.paddleSweep = Math.sin(t * 5.2) * 0.52;
      p.clavusWave = t * 6.0;
      break;
    case 'relax':
      p.paddleSweep = Math.sin(t * 1.0) * 0.1;
      p.bobY = Math.sin(t * 1.2) * 2.4;
      break;
    case 'left_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.left_turn, 0, 1) * Math.PI);
      p.turn = -0.24 * k; p.paddleSweep = -0.45 * k;
      break;
    }
    case 'right_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.right_turn, 0, 1) * Math.PI);
      p.turn = 0.24 * k; p.paddleSweep = 0.45 * k;
      break;
    }
    case 'eating': {
      const k = Math.sin(clamp(t / ONE_SHOTS.eating, 0, 1) * Math.PI);
      p.lipPucker = 1 + k * 0.7; p.pulse = 1 + k * 0.04;
      break;
    }
    case 'hungry':
      p.lipPucker = 1.1 + Math.abs(Math.sin(t * 8)) * 0.45;
      p.eyeScale = 1.14; p.paddleSweep = Math.sin(t * 4.5) * 0.3;
      break;
    case 'stress':
      p.jitterX = Math.sin(t * 42) * 1.6; p.jitterY = Math.cos(t * 38) * 1.4;
      p.paddleSweep = Math.sin(t * 12) * 0.35;
      break;
    case 'fear':
      p.jitterX = Math.sin(t * 50) * 2.2; p.jitterY = Math.cos(t * 46) * 1.9;
      p.eyeScale = 1.28; p.paddleSweep = Math.sin(t * 14) * 0.42;
      break;
    case 'shock': {
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.jitterX = Math.sin(t * 58) * 2.6 * k; p.jitterY = Math.cos(t * 54) * 2.1 * k;
      p.eyeScale = 1.38; p.lipPucker = 1.5; p.pulse = 1 + 0.05 * k;
      break;
    }
    case 'happy':
      p.bobY = -Math.abs(Math.sin(t * 5.2)) * 3.5;
      p.paddleSweep = Math.sin(t * 5.2) * 0.42;
      break;
    case 'sad':
      p.paddleSweep = -0.22; p.bobY = 2.4 + Math.sin(t * 1.4) * 1.0;
      break;
  }
  return p;
}

function blendPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], t);
  return out;
}

export class Sunfish {
  static metadata = {
    name: 'Ocean Sunfish',
    category: 'fish',
    baseLength: 230,
    baseWidth: 165
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = sampleSunfishPose('breathing', 0);
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

    const target = sampleSunfishPose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _drawOversizedPaddleFins(ctx, rx, ry, pose) {
    // Signature Mola mola oversized top/bottom paddle fins (sweeping broadly from sides!)
    for (const side of [-1, 1]) {
      const sweep = pose.paddleSweep * side;
      ctx.save();
      ctx.translate(-rx * 0.28, ry * 0.86 * side);
      ctx.rotate(sweep);

      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.bezierCurveTo(6, 32 * side, -16, 48 * side, -34, 42 * side);
      ctx.bezierCurveTo(-40, 26 * side, -28, 10 * side, -22, 0);
      ctx.closePath();

      const pg = ctx.createLinearGradient(0, 0, -32, 44 * side);
      pg.addColorStop(0, '#64748B');
      pg.addColorStop(0.55, '#475569');
      pg.addColorStop(1, '#334155');
      ctx.fillStyle = pg;
      ctx.fill();

      // Fin rays
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.36)';
      ctx.lineWidth = 1.4;
      for (let i = -1; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 6 - 4, 2 * side);
        ctx.quadraticCurveTo(i * 4 - 12, 20 * side, i * 6 - 24, 38 * side);
        ctx.stroke();
      }

      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 3.0;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }

    // Tiny adorable stubby pectoral ear-fins near cheeks
    for (const side of [-1, 1]) {
      const earFlap = Math.sin(this._totalTime * 5 + side) * 0.22;
      ctx.save();
      ctx.translate(rx * 0.34, ry * 0.82 * side);
      ctx.rotate((0.45 + earFlap) * side);
      ctx.beginPath();
      ctx.ellipse(-2, 7 * side, 8, 12, 0.25 * side, 0, Math.PI * 2);
      ctx.fillStyle = '#94A3B8';
      ctx.fill();
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
    }
  }

  _traceSunfishDiscWithClavus(ctx, rx, ry, pose) {
    // Huge round-disc chibi body with scalloped CLAVUS rear edge (no tail peduncle!)
    ctx.beginPath();
    // Smooth rounded front & sides
    ctx.moveTo(-rx * 0.78, -ry * 0.66);
    ctx.bezierCurveTo(-rx * 0.35, -ry * 1.06, rx * 0.72, -ry * 1.02, rx, 0);
    ctx.bezierCurveTo(rx * 0.72, ry * 1.02, -rx * 0.35, ry * 1.06, -rx * 0.78, ry * 0.66);

    // Scalloped clavus ruffle along rear edge (5 gentle wave lobes!)
    const lobes = 5;
    for (let i = 0; i < lobes; i++) {
      const t0 = i / lobes;
      const t1 = (i + 1) / lobes;
      const tm = (t0 + t1) * 0.5;
      const y1 = lerp(ry * 0.66, -ry * 0.66, t1);
      const ym = lerp(ry * 0.66, -ry * 0.66, tm);
      const wave = Math.sin(pose.clavusWave + i * 1.2) * 3.2;
      const xm = -rx * 0.98 - Math.sin(tm * Math.PI) * 14 + wave;
      const x1 = -rx * 0.78 - Math.sin(t1 * Math.PI) * 8;
      ctx.quadraticCurveTo(xm, ym, x1, y1);
    }
    ctx.closePath();
  }

  _drawDiscBody(ctx, rx, ry, pose) {
    // Soft ocean shadow
    ctx.save();
    ctx.translate(6, 10);
    this._traceSunfishDiscWithClavus(ctx, rx, ry, pose);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.fill();
    ctx.restore();

    // Silvery-slate metallic sunfish disc gradient
    this._traceSunfishDiscWithClavus(ctx, rx, ry, pose);
    const bg = ctx.createRadialGradient(rx * 0.22, -ry * 0.24, 12, 0, 0, rx * 1.15);
    bg.addColorStop(0, '#E2E8F0');
    bg.addColorStop(0.38, '#94A3B8');
    bg.addColorStop(0.75, '#64748B');
    bg.addColorStop(1, '#475569');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    this._traceSunfishDiscWithClavus(ctx, rx, ry, pose);
    ctx.clip();

    // Pale silvery dappled ocean mottling across the giant disc
    ctx.fillStyle = 'rgba(241, 245, 249, 0.26)';
    const patches = [
      [18, -28, 22, 13], [-24, -34, 24, 14], [-46, -6, 20, 16],
      [-18, 28, 25, 13], [26, 24, 18, 11], [-62, 18, 16, 12]
    ];
    for (const [px, py, prx, pry] of patches) {
      ctx.beginPath(); ctx.ellipse(px, py, prx, pry, 0.2, 0, Math.PI * 2); ctx.fill();
    }

    // Clavus ridge crease line
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(-rx * 0.68, -ry * 0.72);
    ctx.quadraticCurveTo(-rx * 0.78, 0, -rx * 0.68, ry * 0.72);
    ctx.stroke();

    // Glossy jelly-bean chibi highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.beginPath(); ctx.ellipse(rx * 0.16, -ry * 0.34, rx * 0.36, ry * 0.14, -0.15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.beginPath(); ctx.ellipse(rx * 0.42, -ry * 0.40, 12, 4.5, -0.15, 0, Math.PI * 2); ctx.fill();

    ctx.restore();

    // Bold chibi outline
    this._traceSunfishDiscWithClavus(ctx, rx, ry, pose);
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3.6;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Tiny adorable puckered sunfish mouth at front!
    const pk = pose.lipPucker;
    ctx.save();
    ctx.translate(rx - 2, 0);
    ctx.fillStyle = '#F472B6';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(3.5 * pk, 0, 4.5 * pk, 6.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#831843';
    ctx.beginPath();
    ctx.ellipse(4.5 * pk, 0, 2.0 * pk, 3.0, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawEyesAndEmote(ctx, rx, ry, pose) {
    const st = this._state;

    // Rosy cheek blushes
    for (const side of [-1, 1]) {
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 108, 142, 0.58)' : 'rgba(255, 132, 152, 0.38)';
      ctx.beginPath(); ctx.ellipse(rx * 0.48, ry * 0.56 * side, 11, 6.2, 0.2 * side, 0, Math.PI * 2); ctx.fill();
    }

    // Expressive derpy-cute oversized chibi eyes!
    for (const side of [-1, 1]) {
      const ex = rx * 0.64;
      const ey = ry * 0.36 * side;
      const r = 10.5 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#1E293B'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 2.2, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#1E293B'; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-5.2, -5.2 * side); ctx.lineTo(3.8, 0); ctx.lineTo(-5.2, 5.2 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFDF7'; ctx.strokeStyle = '#1E293B'; ctx.lineWidth = 2.8;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.36 : (st === 'fear' ? r * 0.46 : r * 0.72);
        const ig = ctx.createRadialGradient(0.8, 0, 0.8, 0, 0, ir);
        ig.addColorStop(0, '#BAE6FD'); ig.addColorStop(0.65, '#0284C7'); ig.addColorStop(1, '#1E3A8A');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(1.5, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.2 : (st === 'fear' ? r * 0.26 : r * 0.44);
        ctx.fillStyle = '#0F172A';
        ctx.beginPath(); ctx.arc(1.8, 0, pr, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(4.2, -3.0 * side, r * 0.27, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-1.6, 2.8 * side, r * 0.14, 0, Math.PI * 2); ctx.fill();

        if (st === 'hungry') {
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4 + this._totalTime * 4;
            const rad = k % 2 === 0 ? r * 0.52 : r * 0.2;
            if (k === 0) ctx.moveTo(1.2 + Math.cos(a) * rad, Math.sin(a) * rad);
            else ctx.lineTo(1.2 + Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath(); ctx.fill();
        } else if (st === 'relax') {
          ctx.fillStyle = '#94A3B8';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.5, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#1E293B'; ctx.lineWidth = 2.4;
          ctx.beginPath(); ctx.moveTo(-r, 0.5); ctx.quadraticCurveTo(0, 3.5, r, 0.5); ctx.stroke();
        } else if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.88)';
          ctx.beginPath(); ctx.ellipse(-2.0, 4.0 * side, 4.2, 2.5, 0.3 * side, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'happy' || st === 'hungry' || st === 'shock' || st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(rx * 0.72, -ry - 16);
      if (st === 'happy' || st === 'hungry') {
        ctx.fillStyle = '#FDE047'; ctx.strokeStyle = '#92400E'; ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4; const rad = i % 2 === 0 ? 9.5 : 3.8;
          if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
          else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (st === 'shock') {
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#1E293B'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(-3.2, -16); ctx.lineTo(3.2, -16); ctx.lineTo(2.3, -2); ctx.lineTo(-2.3, -2); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 4.5, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillStyle = '#38BDF8'; ctx.strokeStyle = '#0369A1'; ctx.lineWidth = 1.7;
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(7, 1.5, 0, 7.5); ctx.quadraticCurveTo(-7, 1.5, 0, -10); ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }
  }

  draw(ctx) {
    if (!ctx) return;
    const pose = this._pose;
    const rx = 104 * pose.pulse;
    const ry = 60 * pose.pulse;

    ctx.save();
    ctx.translate(this.x + pose.jitterX, this.y + pose.jitterY + pose.bobY);
    ctx.rotate(this.angle + pose.turn * 0.25);
    ctx.scale(this.scale, this.scale);

    this._drawOversizedPaddleFins(ctx, rx, ry, pose);
    this._drawDiscBody(ctx, rx, ry, pose);
    this._drawEyesAndEmote(ctx, rx, ry, pose);

    ctx.restore();
  }
}

export default Sunfish;
