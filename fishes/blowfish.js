/**
 * Starry Blowfish (Blowfish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 82x62px
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

function sampleBlowPose(state, t) {
  const p = {
    inflate: 1.0, flutter: t * 10, turn: 0, tailWag: 0,
    mouthOpen: 0, eyeScale: 1, jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.inflate = 1.0 + Math.sin(t * 2.4) * 0.04;
      p.flutter = t * 9; p.tailWag = Math.sin(t * 2.2) * 0.16;
      break;
    case 'swimming':
      p.inflate = 0.96; p.flutter = t * 20;
      p.tailWag = Math.sin(t * 9.5) * 0.4;
      break;
    case 'relax':
      p.inflate = 1.04; p.flutter = t * 5;
      p.bobY = Math.sin(t * 1.4) * 1.6;
      break;
    case 'left_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.left_turn, 0, 1) * Math.PI);
      p.turn = -0.26 * k; p.tailWag = -0.45 * k; p.flutter = t * 18;
      break;
    }
    case 'right_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.right_turn, 0, 1) * Math.PI);
      p.turn = 0.26 * k; p.tailWag = 0.45 * k; p.flutter = t * 18;
      break;
    }
    case 'eating': {
      const k = Math.sin(clamp(t / ONE_SHOTS.eating, 0, 1) * Math.PI);
      p.mouthOpen = k * 0.85; p.inflate = 1.0 + k * 0.09; p.flutter = t * 16;
      break;
    }
    case 'hungry':
      p.mouthOpen = 0.25 + Math.abs(Math.sin(t * 8.5)) * 0.45;
      p.eyeScale = 1.14; p.flutter = t * 14;
      break;
    case 'stress':
      p.inflate = 1.18;
      p.jitterX = Math.sin(t * 46) * 1.4; p.jitterY = Math.cos(t * 42) * 1.2;
      p.flutter = t * 22;
      break;
    case 'fear':
      // Inflates extra round in fear!
      p.inflate = 1.38 + Math.sin(t * 14) * 0.04;
      p.jitterX = Math.sin(t * 52) * 1.9; p.jitterY = Math.cos(t * 48) * 1.6;
      p.eyeScale = 1.28; p.flutter = t * 26;
      break;
    case 'shock': {
      // Inflates extra round in shock!
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.inflate = 1.44 - (1 - k) * 0.06;
      p.jitterX = Math.sin(t * 58) * 2.2 * k; p.jitterY = Math.cos(t * 54) * 1.8 * k;
      p.eyeScale = 1.36; p.mouthOpen = 0.65 * k; p.flutter = t * 28;
      break;
    }
    case 'happy':
      p.inflate = 1.06 + Math.sin(t * 6) * 0.04;
      p.bobY = -Math.abs(Math.sin(t * 6.2)) * 2.8;
      p.flutter = t * 16; p.tailWag = Math.sin(t * 7.2) * 0.32;
      break;
    case 'sad':
      p.inflate = 0.92; p.flutter = t * 4;
      p.bobY = 1.8 + Math.sin(t * 1.5) * 0.8;
      break;
  }
  return p;
}

function blendPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], t);
  return out;
}

export class Blowfish {
  static metadata = {
    name: 'Starry Blowfish',
    category: 'fish',
    baseLength: 82,
    baseWidth: 62
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = sampleBlowPose('breathing', 0);
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

    const target = sampleBlowPose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _drawStubbyFins(ctx, rx, ry, pose) {
    for (const side of [-1, 1]) {
      const flap = Math.sin(pose.flutter + side * 0.4) * 0.42;
      ctx.save();
      ctx.translate(rx * 0.2, ry * 0.86 * side);
      ctx.rotate((0.65 + flap) * side);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(6, 10 * side, -6, 14 * side, -10, 7 * side);
      ctx.closePath();
      ctx.fillStyle = 'rgba(245, 240, 215, 0.86)';
      ctx.fill();
      ctx.strokeStyle = '#1C2415';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(-rx * 0.9, pose.turn * 9);
    ctx.rotate(pose.tailWag * 0.7 + pose.turn * 0.55);
    ctx.beginPath();
    ctx.moveTo(3, -5);
    ctx.quadraticCurveTo(-8, -13, -16, -10);
    ctx.quadraticCurveTo(-18, 0, -16, 10);
    ctx.quadraticCurveTo(-8, 13, 3, 5);
    ctx.closePath();
    ctx.fillStyle = '#556B38';
    ctx.fill();
    ctx.strokeStyle = '#1C2415';
    ctx.lineWidth = 2.1;
    ctx.stroke();
    ctx.restore();
  }

  _drawStarryBody(ctx, rx, ry, pose) {
    // Shadow
    ctx.save();
    ctx.translate(4, 7);
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(28, 36, 21, 0.22)';
    ctx.fill();
    ctx.restore();

    // Bouncy cream belly rim peeking around plump dark-olive back!
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FEF9E7';
    ctx.fill();

    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();

    // Dark-olive starry dorsal cape covering top back
    const capeRx = rx * (0.86 - (pose.inflate - 1) * 0.12);
    const capeRy = ry * (0.82 - (pose.inflate - 1) * 0.14);
    const bg = ctx.createRadialGradient(rx * 0.1, -ry * 0.18, 3, 0, 0, capeRx * 1.1);
    bg.addColorStop(0, '#5E7438');
    bg.addColorStop(0.55, '#3E5024');
    bg.addColorStop(1, '#263315');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(-rx * 0.04, 0, capeRx, capeRy, 0, 0, Math.PI * 2); ctx.fill();

    // Bright white star-dots speckled across the dark-olive back!
    const stars = [
      [0.08, -0.42, 2.8], [-0.20, -0.48, 3.2], [-0.46, -0.28, 2.7],
      [0.02, 0.0, 3.4], [-0.26, -0.06, 3.0], [-0.54, 0.05, 2.5],
      [0.10, 0.42, 2.8], [-0.18, 0.46, 3.1], [-0.44, 0.30, 2.6],
      [-0.66, -0.14, 2.2], [-0.64, 0.20, 2.2], [0.24, -0.18, 2.4], [0.24, 0.18, 2.4]
    ];
    for (const [fx, fy, sr] of stars) {
      const sx = fx * rx, sy = fy * ry;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const rad = k % 2 === 0 ? sr : sr * 0.45;
        if (k === 0) ctx.moveTo(sx + Math.cos(a) * rad, sy + Math.sin(a) * rad);
        else ctx.lineTo(sx + Math.cos(a) * rad, sy + Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.fill();
    }

    // Glossy jelly-bean chibi highlight
    ctx.fillStyle = 'rgba(255, 255, 245, 0.36)';
    ctx.beginPath(); ctx.ellipse(rx * 0.14, -ry * 0.28, rx * 0.34, ry * 0.15, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#1C2415';
    ctx.lineWidth = 3.0;
    ctx.stroke();

    // Cute cream-pink puff mouth
    ctx.save();
    ctx.translate(rx - 1, 0);
    ctx.fillStyle = '#FDA4AF'; ctx.strokeStyle = '#1C2415'; ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.ellipse(2.5 + pose.mouthOpen * 2.5, 0, 3.0 + pose.mouthOpen * 2.8, 3.8 + pose.mouthOpen * 2.2, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  _drawEyesAndEmote(ctx, rx, ry, pose) {
    const st = this._state;

    for (const side of [-1, 1]) {
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 108, 142, 0.62)' : 'rgba(255, 132, 152, 0.42)';
      ctx.beginPath(); ctx.ellipse(rx * 0.34, ry * 0.68 * side, 5.5, 3.2, 0.2 * side, 0, Math.PI * 2); ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ex = rx * 0.56;
      const ey = ry * 0.45 * side;
      const r = 7.2 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#1C2415'; ctx.lineWidth = 2.7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 1.5, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#1C2415'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-3.5, -3.5 * side); ctx.lineTo(2.6, 0); ctx.lineTo(-3.5, 3.5 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFDF7'; ctx.strokeStyle = '#1C2415'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.38 : (st === 'fear' ? r * 0.48 : r * 0.74);
        const ig = ctx.createRadialGradient(0.5, 0, 0.5, 0, 0, ir);
        ig.addColorStop(0, '#BEF264'); ig.addColorStop(0.65, '#65A30D'); ig.addColorStop(1, '#365314');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(1.0, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.22 : (st === 'fear' ? r * 0.28 : r * 0.45);
        ctx.fillStyle = '#12180C';
        ctx.beginPath(); ctx.arc(1.2, 0, pr, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(2.9, -2.0 * side, r * 0.27, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-1.0, 1.8 * side, r * 0.14, 0, Math.PI * 2); ctx.fill();

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
          ctx.fillStyle = '#4E632D';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#1C2415'; ctx.lineWidth = 1.9;
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
      ctx.translate(rx * 0.7, -ry - 10);
      if (st === 'happy' || st === 'hungry') {
        ctx.fillStyle = '#FDE047'; ctx.strokeStyle = '#92400E'; ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4; const rad = i % 2 === 0 ? 6.6 : 2.6;
          if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
          else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (st === 'shock') {
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#1C2415'; ctx.lineWidth = 1.5;
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
    const rx = 30 * pose.inflate;
    const ry = 25.5 * (pose.inflate * 1.05 - 0.05);

    ctx.save();
    ctx.translate(this.x + pose.jitterX, this.y + pose.jitterY + pose.bobY);
    ctx.rotate(this.angle + pose.turn * 0.25);
    ctx.scale(this.scale, this.scale);

    this._drawStubbyFins(ctx, rx, ry, pose);
    this._drawStarryBody(ctx, rx, ry, pose);
    this._drawEyesAndEmote(ctx, rx, ry, pose);

    ctx.restore();
  }
}

export default Blowfish;
