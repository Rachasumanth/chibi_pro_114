/**
 * Spotted Pufferfish (Pufferfish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 85x68px
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

function samplePufferPose(state, t) {
  const p = {
    inflate: 1.0, flutter: t * 10, turn: 0, tailWag: 0,
    lipPucker: 1.0, eyeScale: 1, pulse: 1,
    jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.inflate = 1.0 + Math.sin(t * 2.4) * 0.04;
      p.flutter = t * 9;
      p.tailWag = Math.sin(t * 2.2) * 0.16;
      break;
    case 'swimming':
      p.inflate = 0.96;
      p.flutter = t * 20;
      p.tailWag = Math.sin(t * 9.5) * 0.38;
      break;
    case 'relax':
      p.inflate = 1.04 + Math.sin(t * 1.4) * 0.025;
      p.flutter = t * 5;
      p.bobY = Math.sin(t * 1.5) * 1.8;
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
      p.lipPucker = 1.0 + k * 0.65;
      p.inflate = 1.0 + k * 0.1; p.flutter = t * 16;
      break;
    }
    case 'hungry':
      p.lipPucker = 1.1 + Math.abs(Math.sin(t * 9)) * 0.5;
      p.eyeScale = 1.14; p.flutter = t * 14;
      break;
    case 'stress':
      p.inflate = 1.18 + Math.sin(t * 10) * 0.04;
      p.jitterX = Math.sin(t * 44) * 1.3; p.jitterY = Math.cos(t * 40) * 1.2;
      p.flutter = t * 22;
      break;
    case 'fear':
      // Extra round balloon inflation in fear!
      p.inflate = 1.38 + Math.sin(t * 14) * 0.04;
      p.jitterX = Math.sin(t * 50) * 1.8; p.jitterY = Math.cos(t * 46) * 1.6;
      p.eyeScale = 1.28; p.flutter = t * 26;
      break;
    case 'shock': {
      // Dramatic balloon puff-up in shock!
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.inflate = 1.44 - (1 - k) * 0.08;
      p.jitterX = Math.sin(t * 58) * 2.2 * k; p.jitterY = Math.cos(t * 54) * 1.8 * k;
      p.eyeScale = 1.36; p.lipPucker = 1.45; p.flutter = t * 28;
      break;
    }
    case 'happy':
      p.inflate = 1.06 + Math.sin(t * 6) * 0.05;
      p.bobY = -Math.abs(Math.sin(t * 6.2)) * 2.8;
      p.flutter = t * 16; p.tailWag = Math.sin(t * 7) * 0.3;
      break;
    case 'sad':
      p.inflate = 0.92; p.flutter = t * 4;
      p.bobY = 1.8 + Math.sin(t * 1.6) * 0.8;
      break;
  }
  return p;
}

function blendPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], t);
  return out;
}

export class Pufferfish {
  static metadata = {
    name: 'Spotted Pufferfish',
    category: 'fish',
    baseLength: 85,
    baseWidth: 68
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = samplePufferPose('breathing', 0);
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

    const target = samplePufferPose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _drawPropellerFins(ctx, rx, ry, pose) {
    // Tiny fluttering translucent propeller pectoral fins
    for (const side of [-1, 1]) {
      const flap = Math.sin(pose.flutter + side * 0.4) * 0.45;
      ctx.save();
      ctx.translate(rx * 0.22, ry * 0.88 * side);
      ctx.rotate((0.65 + flap) * side);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(6, 11 * side, -6, 15 * side, -11, 8 * side);
      ctx.quadraticCurveTo(-5, 2 * side, 0, 0);
      ctx.closePath();

      ctx.fillStyle = 'rgba(254, 240, 199, 0.82)';
      ctx.fill();
      ctx.strokeStyle = '#3B2814';
      ctx.lineWidth = 1.9;
      ctx.stroke();

      // Delicate fin rays
      ctx.strokeStyle = 'rgba(180, 130, 72, 0.55)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(-2, 10 * side);
      ctx.moveTo(0, 0); ctx.lineTo(-7, 8 * side);
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawStubbyTail(ctx, rx, pose) {
    ctx.save();
    ctx.translate(-rx * 0.92, pose.turn * 10);
    ctx.rotate(pose.tailWag * 0.7 + pose.turn * 0.6);

    // Cute fan-shaped translucent puffer tail
    ctx.beginPath();
    ctx.moveTo(4, -5);
    ctx.quadraticCurveTo(-8, -14, -17, -12);
    ctx.quadraticCurveTo(-19, 0, -17, 12);
    ctx.quadraticCurveTo(-8, 14, 4, 5);
    ctx.closePath();

    const tg = ctx.createLinearGradient(0, 0, -18, 0);
    tg.addColorStop(0, '#E8C588');
    tg.addColorStop(1, 'rgba(254, 243, 199, 0.78)');
    ctx.fillStyle = tg;
    ctx.fill();

    ctx.strokeStyle = 'rgba(138, 92, 42, 0.45)';
    ctx.lineWidth = 1.0;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-15, i * 4.5); ctx.stroke();
    }

    ctx.strokeStyle = '#3B2814';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
  }

  _drawBalloonBody(ctx, rx, ry, pose) {
    // Drop shadow
    ctx.save();
    ctx.translate(4, 7);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(59, 40, 20, 0.22)';
    ctx.fill();
    ctx.restore();

    // Super-round balloon-like tan/cream chibi body
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(rx * 0.18, -ry * 0.22, 4, 0, 0, Math.max(rx, ry) * 1.08);
    bg.addColorStop(0, '#FDE6B0');
    bg.addColorStop(0.42, '#E2B66A');
    bg.addColorStop(0.78, '#B8843B');
    bg.addColorStop(1, '#8A5D24');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();

    // Creamy-white bouncy belly rim peeking along sides when inflated
    ctx.strokeStyle = 'rgba(255, 250, 235, 0.72)';
    ctx.lineWidth = 6 * pose.inflate;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.96, ry * 0.96, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Dark leopard spots across the plump tan back!
    const spots = [
      [0.08, -0.45, 4.4], [-0.22, -0.52, 4.8], [-0.48, -0.30, 4.2],
      [0.02, 0.0, 5.0], [-0.28, -0.08, 4.5], [-0.56, 0.04, 3.8],
      [0.10, 0.44, 4.4], [-0.20, 0.50, 4.6], [-0.46, 0.34, 4.0],
      [-0.72, -0.18, 3.2], [-0.70, 0.22, 3.2], [0.28, -0.18, 3.4], [0.26, 0.22, 3.4]
    ];
    for (const [fx, fy, sr] of spots) {
      ctx.fillStyle = '#4A3115';
      ctx.beginPath();
      ctx.ellipse(fx * rx, fy * ry, sr * pose.inflate * 0.95, sr * pose.inflate * 0.78, fx, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(248, 224, 168, 0.32)';
      ctx.beginPath();
      ctx.arc(fx * rx + 0.8, fy * ry - 0.8, sr * 0.36, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glossy jelly-bean highlight on round dome
    ctx.fillStyle = 'rgba(255, 255, 245, 0.45)';
    ctx.beginPath();
    ctx.ellipse(rx * 0.15, -ry * 0.28, rx * 0.36, ry * 0.16, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.beginPath();
    ctx.ellipse(rx * 0.34, -ry * 0.34, rx * 0.1, ry * 0.06, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bold chibi outline
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#3B2814';
    ctx.lineWidth = 3.0;
    ctx.stroke();

    // Tiny cute dorsal nub fin
    ctx.save();
    ctx.translate(-rx * 0.35, 0);
    ctx.fillStyle = 'rgba(245, 214, 152, 0.86)';
    ctx.strokeStyle = '#3B2814';
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 3.2, pose.tailWag * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Puckered kissy lips at the front snout!
    const pucker = pose.lipPucker;
    ctx.save();
    ctx.translate(rx - 1, 0);
    ctx.fillStyle = '#FB7185';
    ctx.strokeStyle = '#3B2814';
    ctx.lineWidth = 2.0;
    // Upper & lower kissy lip cushions
    ctx.beginPath();
    ctx.ellipse(3.5 * pucker, -2.8, 4.2 * pucker, 3.3, 0.2, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(3.5 * pucker, 2.8, 4.2 * pucker, 3.3, -0.2, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Cute little 'o' mouth center
    ctx.fillStyle = '#9F1239';
    ctx.beginPath();
    ctx.arc(4.8 * pucker, 0, 1.8 * pucker, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawEyesAndEmote(ctx, rx, ry, pose) {
    const st = this._state;

    // Big rosy chibi cheek blushes
    for (const side of [-1, 1]) {
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 108, 142, 0.62)' : 'rgba(255, 132, 152, 0.42)';
      ctx.beginPath();
      ctx.ellipse(rx * 0.34, ry * 0.68 * side, 5.8, 3.4, 0.2 * side, 0, Math.PI * 2);
      ctx.fill();
    }

    // Giant adorable turquoise-amber chibi puffer eyes!
    for (const side of [-1, 1]) {
      const ex = rx * 0.56;
      const ey = ry * 0.46 * side;
      const r = 7.4 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#3B2814'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 1.5, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#3B2814'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-3.6, -3.6 * side); ctx.lineTo(2.8, 0); ctx.lineTo(-3.6, 3.6 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFDF7'; ctx.strokeStyle = '#3B2814'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.38 : (st === 'fear' ? r * 0.48 : r * 0.74);
        const ig = ctx.createRadialGradient(0.6, 0, 0.5, 0, 0, ir);
        ig.addColorStop(0, '#5EEAD4'); ig.addColorStop(0.65, '#0D9488'); ig.addColorStop(1, '#115E59');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(1.1, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.22 : (st === 'fear' ? r * 0.28 : r * 0.45);
        ctx.fillStyle = '#18120B';
        ctx.beginPath(); ctx.arc(1.3, 0, pr, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(3.0, -2.1 * side, r * 0.27, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-1.1, 1.9 * side, r * 0.14, 0, Math.PI * 2); ctx.fill();

        if (st === 'hungry') {
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4 + this._totalTime * 4;
            const rad = k % 2 === 0 ? r * 0.52 : r * 0.2;
            if (k === 0) ctx.moveTo(0.9 + Math.cos(a) * rad, Math.sin(a) * rad);
            else ctx.lineTo(0.9 + Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath(); ctx.fill();
        } else if (st === 'relax') {
          ctx.fillStyle = '#E2B66A';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#3B2814'; ctx.lineWidth = 1.9;
          ctx.beginPath(); ctx.moveTo(-r, 0.4); ctx.quadraticCurveTo(0, 2.5, r, 0.4); ctx.stroke();
        } else if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.88)';
          ctx.beginPath(); ctx.ellipse(-1.5, 2.8 * side, 3.0, 1.8, 0.3 * side, 0, Math.PI * 2); ctx.fill();
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
          const a = (i * Math.PI) / 4; const rad = i % 2 === 0 ? 6.8 : 2.6;
          if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
          else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (st === 'shock') {
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#3B2814'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-2.5, -12); ctx.lineTo(2.5, -12); ctx.lineTo(1.8, -1); ctx.lineTo(-1.8, -1); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 3.5, 2.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
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
    // Super-round balloon proportions (85x68 base, expands extra round when inflated)
    const rx = 31 * pose.inflate;
    const ry = 27.5 * (pose.inflate * 1.04 - 0.04);

    ctx.save();
    ctx.translate(this.x + pose.jitterX, this.y + pose.jitterY + pose.bobY);
    ctx.rotate(this.angle + pose.turn * 0.25);
    ctx.scale(this.scale, this.scale);

    this._drawPropellerFins(ctx, rx, ry, pose);
    this._drawStubbyTail(ctx, rx, pose);
    this._drawBalloonBody(ctx, rx, ry, pose);
    this._drawEyesAndEmote(ctx, rx, ry, pose);

    ctx.restore();
  }
}

export default Pufferfish;
