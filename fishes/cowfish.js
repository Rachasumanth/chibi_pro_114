/**
 * Longhorn Cowfish (Cowfish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 75x46px
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

function sampleCowPose(state, t) {
  const p = {
    flutter: t * 10, turn: 0, tailWag: 0, lipPucker: 1.0,
    eyeScale: 1, pulse: 1, jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.flutter = t * 8.5; p.tailWag = Math.sin(t * 2.2) * 0.2;
      p.pulse = 1 + Math.sin(t * 2.4) * 0.025;
      break;
    case 'swimming':
      p.flutter = t * 20; p.tailWag = Math.sin(t * 9.5) * 0.45;
      break;
    case 'relax':
      p.flutter = t * 5; p.tailWag = Math.sin(t * 1.4) * 0.12;
      p.bobY = Math.sin(t * 1.5) * 1.5;
      break;
    case 'left_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.left_turn, 0, 1) * Math.PI);
      p.turn = -0.26 * k; p.tailWag = -0.48 * k; p.flutter = t * 17;
      break;
    }
    case 'right_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.right_turn, 0, 1) * Math.PI);
      p.turn = 0.26 * k; p.tailWag = 0.48 * k; p.flutter = t * 17;
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
      p.flutter = t * 18; p.tailWag = Math.sin(t * 7.5) * 0.36;
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

export class Cowfish {
  static metadata = {
    name: 'Longhorn Cowfish',
    category: 'fish',
    baseLength: 75,
    baseWidth: 46
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = sampleCowPose('breathing', 0);
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

    const target = sampleCowPose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _traceCowCarapace(ctx, hw, hh) {
    // Tapered boxy carapace (slightly wider at shoulders, narrowing gently toward long tail)
    ctx.beginPath();
    ctx.moveTo(hw, -hh * 0.65);
    ctx.quadraticCurveTo(hw, -hh, hw - 8, -hh);
    ctx.lineTo(-hw * 0.65, -hh * 0.88);
    ctx.quadraticCurveTo(-hw, -hh * 0.72, -hw, -hh * 0.35);
    ctx.lineTo(-hw, hh * 0.35);
    ctx.quadraticCurveTo(-hw, hh * 0.72, -hw * 0.65, hh * 0.88);
    ctx.lineTo(hw - 8, hh);
    ctx.quadraticCurveTo(hw, hh, hw, hh * 0.65);
    ctx.closePath();
  }

  _drawHornsAndRearSpines(ctx, hw, hh) {
    // Signature TWO FORWARD-POINTING CURVED COW HORNS above the eyes!
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(hw - 3, (hh * 0.54) * side);
      ctx.quadraticCurveTo(hw + 11, (hh * 0.74) * side, hw + 20, (hh * 0.38) * side);
      ctx.quadraticCurveTo(hw + 10, (hh * 0.42) * side, hw - 1, (hh * 0.32) * side);
      ctx.closePath();
      const hg = ctx.createLinearGradient(hw - 2, 0, hw + 20, 0);
      hg.addColorStop(0, '#EAB308');
      hg.addColorStop(0.6, '#FEF08A');
      hg.addColorStop(1, '#FFFDF5');
      ctx.fillStyle = hg;
      ctx.fill();
      ctx.strokeStyle = '#2E210A';
      ctx.lineWidth = 2.0;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Tiny rear pelvic horns pointing backward
      ctx.beginPath();
      ctx.moveTo(-hw + 3, (hh * 0.68) * side);
      ctx.lineTo(-hw - 8, (hh * 0.78) * side);
      ctx.lineTo(-hw + 1, (hh * 0.48) * side);
      ctx.closePath();
      ctx.fillStyle = '#FEF08A';
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawLongFlowingFanTail(ctx, hw, pose) {
    ctx.save();
    ctx.translate(-hw + 1, pose.turn * 7);
    ctx.rotate(pose.tailWag * 0.7 + pose.turn * 0.6);

    // Long flowing golden-translucent fan tail
    ctx.beginPath();
    ctx.moveTo(2, -4.5);
    ctx.bezierCurveTo(-9, -8, -19, -15, -27, -13);
    ctx.quadraticCurveTo(-30, 0, -27, 13);
    ctx.bezierCurveTo(-19, 15, -9, 8, 2, 4.5);
    ctx.closePath();

    const tg = ctx.createLinearGradient(0, 0, -28, 0);
    tg.addColorStop(0, '#F59E0B');
    tg.addColorStop(0.55, 'rgba(253, 224, 71, 0.85)');
    tg.addColorStop(1, 'rgba(254, 249, 195, 0.72)');
    ctx.fillStyle = tg;
    ctx.fill();

    // Fine glowing tail rays
    ctx.strokeStyle = 'rgba(180, 110, 15, 0.45)';
    ctx.lineWidth = 1.0;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-26, i * 3.8); ctx.stroke();
    }

    ctx.strokeStyle = '#2E210A';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.restore();
  }

  _drawPectorals(ctx, hw, hh, pose) {
    for (const side of [-1, 1]) {
      const flap = Math.sin(pose.flutter + side * 0.5) * 0.42;
      ctx.save();
      ctx.translate(hw * 0.12, hh * 0.96 * side);
      ctx.rotate((0.68 + flap) * side);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(5, 9 * side, -5, 13 * side, -10, 6 * side);
      ctx.closePath();
      ctx.fillStyle = 'rgba(254, 249, 195, 0.85)';
      ctx.fill();
      ctx.strokeStyle = '#2E210A';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawCarapace(ctx, hw, hh, pose) {
    // Shadow
    ctx.save();
    ctx.translate(4, 7);
    this._traceCowCarapace(ctx, hw, hh);
    ctx.fillStyle = 'rgba(46, 33, 10, 0.22)';
    ctx.fill();
    ctx.restore();

    // Golden-yellow carapace gradient
    this._traceCowCarapace(ctx, hw, hh);
    const bg = ctx.createLinearGradient(hw, -hh, -hw, hh);
    bg.addColorStop(0, '#FDE047');
    bg.addColorStop(0.4, '#F59E0B');
    bg.addColorStop(0.85, '#D97706');
    bg.addColorStop(1, '#B45309');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    this._traceCowCarapace(ctx, hw, hh);
    ctx.clip();

    // Subtle iridescent sky-blue spots inside hexagonal plates!
    const blueSpots = [
      [-12, -10, 2.8], [-2, -12, 2.6], [7, -9, 2.4],
      [-15, 0, 3.0], [-4, -1, 3.2], [6, 1, 2.5],
      [-12, 10, 2.8], [-2, 11, 2.7], [7, 9, 2.4]
    ];
    for (const [bx, by, br] of blueSpots) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.72)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }

    // Glossy chibi highlight
    ctx.fillStyle = 'rgba(255, 255, 240, 0.48)';
    ctx.beginPath(); ctx.ellipse(2, -hh * 0.36, 11, 3.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    this._traceCowCarapace(ctx, hw, hh);
    ctx.strokeStyle = '#2E210A';
    ctx.lineWidth = 2.8;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Cute puckered lips between the horns
    const pk = pose.lipPucker;
    ctx.save();
    ctx.translate(hw - 0.5, 0);
    ctx.fillStyle = '#FB7185';
    ctx.strokeStyle = '#2E210A';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.ellipse(2.6 * pk, -2.2, 3.2 * pk, 2.6, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(2.6 * pk, 2.2, 3.2 * pk, 2.6, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  _drawEyesAndEmote(ctx, hw, hh, pose) {
    const st = this._state;

    for (const side of [-1, 1]) {
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 98, 132, 0.58)' : 'rgba(255, 122, 142, 0.38)';
      ctx.beginPath(); ctx.ellipse(hw * 0.3, hh * 0.7 * side, 4.6, 2.6, 0.15 * side, 0, Math.PI * 2); ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ex = hw * 0.62;
      const ey = hh * 0.50 * side;
      const r = 6.0 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#2E210A'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 1.4, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#2E210A'; ctx.lineWidth = 2.3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-3.0, -3.0 * side); ctx.lineTo(2.4, 0); ctx.lineTo(-3.0, 3.0 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFDF7'; ctx.strokeStyle = '#2E210A'; ctx.lineWidth = 2.0;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.38 : (st === 'fear' ? r * 0.48 : r * 0.74);
        const ig = ctx.createRadialGradient(0.5, 0, 0.5, 0, 0, ir);
        ig.addColorStop(0, '#7DD3FC'); ig.addColorStop(0.65, '#0284C7'); ig.addColorStop(1, '#0C4A6E');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(0.9, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.22 : (st === 'fear' ? r * 0.28 : r * 0.45);
        ctx.fillStyle = '#18120A';
        ctx.beginPath(); ctx.arc(1.1, 0, pr, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(2.5, -1.7 * side, r * 0.27, 0, Math.PI * 2); ctx.fill();
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
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#2E210A'; ctx.lineWidth = 1.8;
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
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#2E210A'; ctx.lineWidth = 1.5;
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
    const hw = 22.0 * pose.pulse;
    const hh = 19.5 * pose.pulse;

    ctx.save();
    ctx.translate(this.x + pose.jitterX, this.y + pose.jitterY + pose.bobY);
    ctx.rotate(this.angle + pose.turn * 0.25);
    ctx.scale(this.scale, this.scale);

    this._drawPectorals(ctx, hw, hh, pose);
    this._drawLongFlowingFanTail(ctx, hw, pose);
    this._drawHornsAndRearSpines(ctx, hw, hh);
    this._drawCarapace(ctx, hw, hh, pose);
    this._drawEyesAndEmote(ctx, hw, hh, pose);

    ctx.restore();
  }
}

export default Cowfish;
