/**
 * Yellow Boxfish (Boxfish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 65x48px
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

function sampleBoxPose(state, t) {
  const p = {
    flutter: t * 11, turn: 0, tailWag: 0, lipPucker: 1.0,
    eyeScale: 1, pulse: 1, jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.flutter = t * 9; p.tailWag = Math.sin(t * 2.4) * 0.18;
      p.pulse = 1 + Math.sin(t * 2.5) * 0.025;
      break;
    case 'swimming':
      p.flutter = t * 22; p.tailWag = Math.sin(t * 10) * 0.42;
      break;
    case 'relax':
      p.flutter = t * 5; p.bobY = Math.sin(t * 1.5) * 1.5;
      break;
    case 'left_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.left_turn, 0, 1) * Math.PI);
      p.turn = -0.26 * k; p.tailWag = -0.48 * k; p.flutter = t * 18;
      break;
    }
    case 'right_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.right_turn, 0, 1) * Math.PI);
      p.turn = 0.26 * k; p.tailWag = 0.48 * k; p.flutter = t * 18;
      break;
    }
    case 'eating': {
      const k = Math.sin(clamp(t / ONE_SHOTS.eating, 0, 1) * Math.PI);
      p.lipPucker = 1 + k * 0.65; p.pulse = 1 + k * 0.06; p.flutter = t * 16;
      break;
    }
    case 'hungry':
      p.lipPucker = 1.1 + Math.abs(Math.sin(t * 9)) * 0.45;
      p.eyeScale = 1.14; p.flutter = t * 14;
      break;
    case 'stress':
      p.jitterX = Math.sin(t * 46) * 1.3; p.jitterY = Math.cos(t * 42) * 1.2;
      p.flutter = t * 22;
      break;
    case 'fear':
      p.jitterX = Math.sin(t * 52) * 1.8; p.jitterY = Math.cos(t * 48) * 1.6;
      p.eyeScale = 1.25; p.flutter = t * 26;
      break;
    case 'shock': {
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.jitterX = Math.sin(t * 58) * 2.1 * k; p.jitterY = Math.cos(t * 54) * 1.7 * k;
      p.eyeScale = 1.35; p.lipPucker = 1.45; p.pulse = 1 + 0.07 * k;
      break;
    }
    case 'happy':
      p.bobY = -Math.abs(Math.sin(t * 6.5)) * 2.6;
      p.flutter = t * 18; p.tailWag = Math.sin(t * 8) * 0.35;
      break;
    case 'sad':
      p.flutter = t * 4; p.bobY = 1.6 + Math.sin(t * 1.6) * 0.8;
      break;
  }
  return p;
}

function blendPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], t);
  return out;
}

export class Boxfish {
  static metadata = {
    name: 'Yellow Boxfish',
    category: 'fish',
    baseLength: 65,
    baseWidth: 48
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = sampleBoxPose('breathing', 0);
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

    const target = sampleBoxPose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _traceCubicCarapace(ctx, hw, hh) {
    // Cute rounded rectangular/cubic top-down armored carapace
    const r = 9.5;
    ctx.beginPath();
    ctx.moveTo(-hw + r, -hh);
    ctx.lineTo(hw - r, -hh);
    ctx.quadraticCurveTo(hw, -hh, hw, -hh + r);
    ctx.lineTo(hw, hh - r);
    ctx.quadraticCurveTo(hw, hh, hw - r, hh);
    ctx.lineTo(-hw + r, hh);
    ctx.quadraticCurveTo(-hw, hh, -hw, hh - r);
    ctx.lineTo(-hw, -hh + r);
    ctx.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    ctx.closePath();
  }

  _drawHexagon(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  _drawFins(ctx, hw, hh, pose) {
    // Tiny fluttering translucent pectoral fins on box sides
    for (const side of [-1, 1]) {
      const flap = Math.sin(pose.flutter + side * 0.5) * 0.42;
      ctx.save();
      ctx.translate(hw * 0.12, hh * side);
      ctx.rotate((0.68 + flap) * side);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(5, 9 * side, -5, 12 * side, -9, 6 * side);
      ctx.closePath();
      ctx.fillStyle = 'rgba(254, 249, 195, 0.85)';
      ctx.fill();
      ctx.strokeStyle = '#291E0B';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }

    // Little fan tail wagging off rear of cube
    ctx.save();
    ctx.translate(-hw + 1, pose.turn * 7);
    ctx.rotate(pose.tailWag * 0.75 + pose.turn * 0.6);
    ctx.beginPath();
    ctx.moveTo(2, -4);
    ctx.quadraticCurveTo(-8, -11, -15, -9);
    ctx.quadraticCurveTo(-17, 0, -15, 9);
    ctx.quadraticCurveTo(-8, 11, 2, 4);
    ctx.closePath();
    ctx.fillStyle = 'rgba(254, 240, 138, 0.88)';
    ctx.fill();
    ctx.strokeStyle = '#291E0B';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.restore();
  }

  _drawArmoredCarapace(ctx, hw, hh, pose) {
    // Shadow
    ctx.save();
    ctx.translate(4, 7);
    this._traceCubicCarapace(ctx, hw, hh);
    ctx.fillStyle = 'rgba(41, 30, 11, 0.22)';
    ctx.fill();
    ctx.restore();

    // Bright sunny yellow carapace gradient
    this._traceCubicCarapace(ctx, hw, hh);
    const bg = ctx.createLinearGradient(hw, -hh, -hw, hh);
    bg.addColorStop(0, '#FEF08A');
    bg.addColorStop(0.35, '#FACC15');
    bg.addColorStop(0.78, '#EAB308');
    bg.addColorStop(1, '#CA8A04');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    this._traceCubicCarapace(ctx, hw, hh);
    ctx.clip();

    // Beveled 3D top-down cube facet edges (gives unmistakable boxy charm!)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 2.2;
    this._traceCubicCarapace(ctx, hw - 4.5, hh - 4.5);
    ctx.stroke();

    // Hexagonal bony armor plate grid lines
    ctx.strokeStyle = 'rgba(161, 98, 7, 0.34)';
    ctx.lineWidth = 1.1;
    const hexR = 6.2;
    for (let gx = -22; gx <= 18; gx += hexR * 1.55) {
      const colIdx = Math.round((gx + 22) / (hexR * 1.55));
      for (let gy = -18; gy <= 18; gy += hexR * 1.75) {
        const yOff = (colIdx % 2) * (hexR * 0.87);
        this._drawHexagon(ctx, gx, gy + yOff, hexR);
      }
    }

    // Crisp black polka-dots!
    const dots = [
      [-14, -13, 3.0], [-2, -14, 2.7], [8, -12, 2.4],
      [-17, -2, 2.8], [-5, -3, 3.3], [5, -1, 2.5],
      [-14, 11, 3.0], [-2, 12, 2.9], [9, 11, 2.4],
      [-21, 5, 2.2], [-21, -8, 2.2]
    ];
    for (const [dx, dy, dr] of dots) {
      ctx.fillStyle = '#1C1917';
      ctx.beginPath(); ctx.arc(dx, dy, dr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath(); ctx.arc(dx + 0.7, dy - 0.7, dr * 0.32, 0, Math.PI * 2); ctx.fill();
    }

    // Glossy jelly-bean highlight on top of cube
    ctx.fillStyle = 'rgba(255, 255, 245, 0.48)';
    ctx.beginPath(); ctx.ellipse(2, -hh * 0.38, 12, 3.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Bold chibi outline
    this._traceCubicCarapace(ctx, hw, hh);
    ctx.strokeStyle = '#291E0B';
    ctx.lineWidth = 3.0;
    ctx.stroke();

    // Puckered kissy lips on front face of cube!
    const pk = pose.lipPucker;
    ctx.save();
    ctx.translate(hw - 0.5, 0);
    ctx.fillStyle = '#FB923C';
    ctx.strokeStyle = '#291E0B';
    ctx.lineWidth = 1.9;
    ctx.beginPath(); ctx.ellipse(3.0 * pk, -2.5, 3.6 * pk, 2.9, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(3.0 * pk, 2.5, 3.6 * pk, 2.9, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9A3412';
    ctx.beginPath(); ctx.arc(4.2 * pk, 0, 1.5 * pk, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  _drawEyesAndEmote(ctx, hw, hh, pose) {
    const st = this._state;

    for (const side of [-1, 1]) {
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 98, 132, 0.6)' : 'rgba(255, 122, 142, 0.4)';
      ctx.beginPath(); ctx.ellipse(hw * 0.34, hh * 0.72 * side, 4.8, 2.8, 0.15 * side, 0, Math.PI * 2); ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ex = hw * 0.64;
      const ey = hh * 0.52 * side;
      const r = 6.2 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#291E0B'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 1.4, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#291E0B'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-3.2, -3.2 * side); ctx.lineTo(2.4, 0); ctx.lineTo(-3.2, 3.2 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFDF7'; ctx.strokeStyle = '#291E0B'; ctx.lineWidth = 2.1;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.38 : (st === 'fear' ? r * 0.48 : r * 0.74);
        const ig = ctx.createRadialGradient(0.5, 0, 0.5, 0, 0, ir);
        ig.addColorStop(0, '#FDE047'); ig.addColorStop(0.65, '#D97706'); ig.addColorStop(1, '#78350F');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(0.9, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.22 : (st === 'fear' ? r * 0.28 : r * 0.46);
        ctx.fillStyle = '#18120A';
        ctx.beginPath(); ctx.arc(1.1, 0, pr, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(2.6, -1.8 * side, r * 0.27, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-0.9, 1.6 * side, r * 0.14, 0, Math.PI * 2); ctx.fill();

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
          ctx.fillStyle = '#FACC15';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#291E0B'; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.moveTo(-r, 0.4); ctx.quadraticCurveTo(0, 2.2, r, 0.4); ctx.stroke();
        } else if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.88)';
          ctx.beginPath(); ctx.ellipse(-1.4, 2.5 * side, 2.6, 1.6, 0.3 * side, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'happy' || st === 'hungry' || st === 'shock' || st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(hw * 0.7, -hh - 12);
      if (st === 'happy' || st === 'hungry') {
        ctx.fillStyle = '#FDE047'; ctx.strokeStyle = '#92400E'; ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4; const rad = i % 2 === 0 ? 6.2 : 2.4;
          if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
          else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (st === 'shock') {
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#291E0B'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-2.3, -11); ctx.lineTo(2.3, -11); ctx.lineTo(1.7, -1); ctx.lineTo(-1.7, -1); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 3.2, 2.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillStyle = '#38BDF8'; ctx.strokeStyle = '#0369A1'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(0, -7); ctx.quadraticCurveTo(4.8, 1, 0, 5.2); ctx.quadraticCurveTo(-4.8, 1, 0, -7); ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }
  }

  draw(ctx) {
    if (!ctx) return;
    const pose = this._pose;
    const hw = 24.5 * pose.pulse;
    const hh = 21.0 * pose.pulse;

    ctx.save();
    ctx.translate(this.x + pose.jitterX, this.y + pose.jitterY + pose.bobY);
    ctx.rotate(this.angle + pose.turn * 0.25);
    ctx.scale(this.scale, this.scale);

    this._drawFins(ctx, hw, hh, pose);
    this._drawArmoredCarapace(ctx, hw, hh, pose);
    this._drawEyesAndEmote(ctx, hw, hh, pose);

    ctx.restore();
  }
}

export default Boxfish;
