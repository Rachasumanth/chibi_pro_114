/**
 * Warty Frogfish (Frogfish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 78x56px
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

function sampleFrogPose(state, t) {
  const p = {
    legWalk: 0, lureSwing: Math.sin(t * 3.8) * 6, tailWag: 0, turn: 0,
    mouthOpen: 0, eyeScale: 1, pulse: 1, jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.legWalk = Math.sin(t * 2.0) * 0.12;
      p.lureSwing = Math.sin(t * 4.2) * 7.5;
      p.pulse = 1 + Math.sin(t * 2.2) * 0.032;
      break;
    case 'swimming':
      p.legWalk = Math.sin(t * 9.0) * 0.45;
      p.tailWag = Math.sin(t * 9.0) * 0.42;
      p.lureSwing = Math.sin(t * 7.0) * 5;
      break;
    case 'relax':
      p.lureSwing = Math.sin(t * 1.8) * 3;
      p.bobY = Math.sin(t * 1.3) * 1.4;
      break;
    case 'left_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.left_turn, 0, 1) * Math.PI);
      p.turn = -0.28 * k; p.tailWag = -0.44 * k; p.legWalk = 0.35 * k;
      break;
    }
    case 'right_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.right_turn, 0, 1) * Math.PI);
      p.turn = 0.28 * k; p.tailWag = 0.44 * k; p.legWalk = -0.35 * k;
      break;
    }
    case 'eating': {
      const k = Math.sin(clamp(t / ONE_SHOTS.eating, 0, 1) * Math.PI);
      p.mouthOpen = k * 0.95; p.pulse = 1 + k * 0.09; p.lureSwing = 0;
      break;
    }
    case 'hungry':
      p.mouthOpen = 0.22 + Math.abs(Math.sin(t * 8.5)) * 0.45;
      p.lureSwing = Math.sin(t * 10) * 11; p.eyeScale = 1.14;
      break;
    case 'stress':
      p.jitterX = Math.sin(t * 46) * 1.4; p.jitterY = Math.cos(t * 42) * 1.2;
      p.lureSwing = Math.sin(t * 16) * 8;
      break;
    case 'fear':
      p.jitterX = Math.sin(t * 52) * 1.9; p.jitterY = Math.cos(t * 48) * 1.6;
      p.eyeScale = 1.26;
      break;
    case 'shock': {
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.jitterX = Math.sin(t * 58) * 2.2 * k; p.jitterY = Math.cos(t * 54) * 1.8 * k;
      p.eyeScale = 1.35; p.mouthOpen = 0.72 * k; p.pulse = 1 + 0.08 * k;
      break;
    }
    case 'happy':
      p.bobY = -Math.abs(Math.sin(t * 6.2)) * 2.8;
      p.legWalk = Math.sin(t * 7.2) * 0.35; p.lureSwing = Math.sin(t * 8) * 9;
      break;
    case 'sad':
      p.lureSwing = -2; p.bobY = 1.6 + Math.sin(t * 1.5) * 0.8;
      break;
  }
  return p;
}

function blendPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], t);
  return out;
}

export class Frogfish {
  static metadata = {
    name: 'Warty Frogfish',
    category: 'fish',
    baseLength: 78,
    baseWidth: 56
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = sampleFrogPose('breathing', 0);
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

    const target = sampleFrogPose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _drawGrippingLegFins(ctx, rx, ry, pose) {
    // Signature stubby leg-like gripping pectoral fins with little toe-rays!
    for (const side of [-1, 1]) {
      const stepAng = pose.legWalk * side;
      ctx.save();
      ctx.translate(rx * 0.12, ry * 0.82 * side);
      ctx.rotate(stepAng);

      // Bent frog-arm pectoral limb + webbed gripping hand
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.quadraticCurveTo(10, 12 * side, 14, 17 * side);
      ctx.quadraticCurveTo(6, 22 * side, -3, 18 * side);
      ctx.quadraticCurveTo(-8, 12 * side, -6, 0);
      ctx.closePath();

      const lg = ctx.createLinearGradient(0, 0, 12, 18 * side);
      lg.addColorStop(0, '#F59E0B');
      lg.addColorStop(1, '#EA580C');
      ctx.fillStyle = lg;
      ctx.fill();
      ctx.strokeStyle = '#3B1D0A';
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Cute gripping toe rays
      ctx.strokeStyle = '#3B1D0A';
      ctx.lineWidth = 1.4;
      for (const tx of [2, 6, 10]) {
        ctx.beginPath();
        ctx.moveTo(tx - 1, 11 * side);
        ctx.lineTo(tx + 2, 18 * side);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawTail(ctx, rx, pose) {
    ctx.save();
    ctx.translate(-rx * 0.9, pose.turn * 8);
    ctx.rotate(pose.tailWag * 0.7 + pose.turn * 0.55);

    ctx.beginPath();
    ctx.moveTo(3, -5);
    ctx.quadraticCurveTo(-8, -14, -17, -11);
    ctx.quadraticCurveTo(-19, 0, -17, 11);
    ctx.quadraticCurveTo(-8, 14, 3, 5);
    ctx.closePath();

    ctx.fillStyle = '#FB923C';
    ctx.fill();
    ctx.strokeStyle = '#3B1D0A';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
  }

  _traceLumpyFrogBody(ctx, rx, ry) {
    // Organic lumpy sponge-camouflaged frogfish silhouette
    ctx.beginPath();
    ctx.moveTo(rx, 0);
    ctx.bezierCurveTo(rx * 0.94, -ry * 0.88, rx * 0.3, -ry * 1.08, -rx * 0.15, -ry * 0.98);
    ctx.bezierCurveTo(-rx * 0.65, -ry * 1.06, -rx * 0.96, -ry * 0.6, -rx, 0);
    ctx.bezierCurveTo(-rx * 0.96, ry * 0.6, -rx * 0.65, ry * 1.06, -rx * 0.15, ry * 0.98);
    ctx.bezierCurveTo(rx * 0.3, ry * 1.08, rx * 0.94, ry * 0.88, rx, 0);
    ctx.closePath();
  }

  _drawBodyAndWarts(ctx, rx, ry, pose) {
    // Shadow
    ctx.save();
    ctx.translate(4, 7);
    this._traceLumpyFrogBody(ctx, rx, ry);
    ctx.fillStyle = 'rgba(59, 29, 10, 0.22)';
    ctx.fill();
    ctx.restore();

    // Camouflaged golden yellow-orange gradient
    this._traceLumpyFrogBody(ctx, rx, ry);
    const bg = ctx.createRadialGradient(rx * 0.18, -ry * 0.22, 4, 0, 0, rx * 1.15);
    bg.addColorStop(0, '#FDE047');
    bg.addColorStop(0.42, '#F59E0B');
    bg.addColorStop(0.82, '#EA580C');
    bg.addColorStop(1, '#C2410C');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    this._traceLumpyFrogBody(ctx, rx, ry);
    ctx.clip();

    // Camouflaged coral-pink & burgundy sponge wart patches!
    const patches = [
      [-14, -12, 7.5, 5.2, '#C2410C'],
      [2, -14, 6.2, 4.4, '#F43F5E'],
      [-18, 8, 7.8, 5.4, '#B45309'],
      [4, 13, 6.5, 4.5, '#FB7185'],
      [-6, -2, 8.2, 5.8, '#D97706'],
      [-22, -2, 5.4, 4.2, '#9A3412']
    ];
    for (const [px, py, prx, pry, col] of patches) {
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.ellipse(px, py, prx, pry, px * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      // Raised wart bump highlight
      ctx.fillStyle = 'rgba(254, 240, 138, 0.58)';
      ctx.beginPath(); ctx.arc(px + 1.2, py - 1.2, prx * 0.32, 0, Math.PI * 2); ctx.fill();
    }

    // Glossy jelly-bean chibi highlight
    ctx.fillStyle = 'rgba(255, 255, 240, 0.42)';
    ctx.beginPath(); ctx.ellipse(rx * 0.2, -ry * 0.3, rx * 0.3, ry * 0.14, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    this._traceLumpyFrogBody(ctx, rx, ry);
    ctx.strokeStyle = '#3B1D0A';
    ctx.lineWidth = 3.0;
    ctx.stroke();

    // Wide frogfish gulp mouth at front
    if (pose.mouthOpen > 0.05) {
      ctx.save();
      ctx.translate(rx - 1, 0);
      ctx.fillStyle = '#9F1239'; ctx.strokeStyle = '#3B1D0A'; ctx.lineWidth = 2.0;
      ctx.beginPath(); ctx.ellipse(2 + pose.mouthOpen * 4, 0, 3.5 + pose.mouthOpen * 4.5, 6.5 + pose.mouthOpen * 3.5, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  _drawEscaFishingLure(ctx, rx, pose) {
    // Signature dangling fishing-rod (illicium + glowing worm-like esca lure) on snout!
    const swing = pose.lureSwing;
    ctx.save();
    ctx.translate(rx * 0.85, 0);

    // Curved fishing rod stalk
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(10, swing * 0.4, 17, swing);
    ctx.strokeStyle = '#3B1D0A';
    ctx.lineWidth = 3.0;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Wiggling fleshy coral-pink esca bait pom-pom at tip
    ctx.translate(17, swing);
    ctx.fillStyle = '#FB7185';
    ctx.strokeStyle = '#3B1D0A';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Little wormy frills on lure
    ctx.fillStyle = '#FFF1F2';
    ctx.beginPath(); ctx.arc(1.2, -1.2, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  _drawEyesAndEmote(ctx, rx, ry, pose) {
    const st = this._state;

    for (const side of [-1, 1]) {
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 98, 132, 0.58)' : 'rgba(255, 122, 142, 0.38)';
      ctx.beginPath(); ctx.ellipse(rx * 0.36, ry * 0.68 * side, 5.2, 3.0, 0.2 * side, 0, Math.PI * 2); ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ex = rx * 0.58;
      const ey = ry * 0.44 * side;
      const r = 6.4 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#3B1D0A'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 1.4, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#3B1D0A'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-3.2, -3.2 * side); ctx.lineTo(2.4, 0); ctx.lineTo(-3.2, 3.2 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFDF7'; ctx.strokeStyle = '#3B1D0A'; ctx.lineWidth = 2.1;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.38 : (st === 'fear' ? r * 0.48 : r * 0.74);
        const ig = ctx.createRadialGradient(0.5, 0, 0.5, 0, 0, ir);
        ig.addColorStop(0, '#A3E635'); ig.addColorStop(0.65, '#4D7C0F'); ig.addColorStop(1, '#1A2E05');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(0.9, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.22 : (st === 'fear' ? r * 0.28 : r * 0.45);
        ctx.fillStyle = '#1C0D05';
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
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#3B1D0A'; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.moveTo(-r, 0.4); ctx.quadraticCurveTo(0, 2.2, r, 0.4); ctx.stroke();
        } else if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.88)';
          ctx.beginPath(); ctx.ellipse(-1.4, 2.6 * side, 2.7, 1.6, 0.3 * side, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'happy' || st === 'hungry' || st === 'shock' || st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(rx * 0.7, -ry - 12);
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
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#3B1D0A'; ctx.lineWidth = 1.5;
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
    const rx = 29 * pose.pulse;
    const ry = 24.5 * pose.pulse;

    ctx.save();
    ctx.translate(this.x + pose.jitterX, this.y + pose.jitterY + pose.bobY);
    ctx.rotate(this.angle + pose.turn * 0.25);
    ctx.scale(this.scale, this.scale);

    this._drawGrippingLegFins(ctx, rx, ry, pose);
    this._drawTail(ctx, rx, pose);
    this._drawBodyAndWarts(ctx, rx, ry, pose);
    this._drawEscaFishingLure(ctx, rx, pose);
    this._drawEyesAndEmote(ctx, rx, ry, pose);

    ctx.restore();
  }
}

export default Frogfish;
