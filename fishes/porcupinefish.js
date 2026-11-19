/**
 * Balloon Porcupinefish (Porcupinefish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 95x76px
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

function samplePorcupinePose(state, t) {
  const p = {
    inflate: 1.0, spikeLen: 1.0, flutter: t * 10, turn: 0,
    tailWag: 0, mouthOpen: 0, eyeScale: 1,
    jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.inflate = 1.0 + Math.sin(t * 2.3) * 0.04;
      p.spikeLen = 0.95 + Math.sin(t * 2.3) * 0.08;
      p.flutter = t * 9; p.tailWag = Math.sin(t * 2.1) * 0.16;
      break;
    case 'swimming':
      p.inflate = 0.95; p.spikeLen = 0.78;
      p.flutter = t * 19; p.tailWag = Math.sin(t * 9.0) * 0.4;
      break;
    case 'relax':
      p.inflate = 1.04; p.spikeLen = 0.72;
      p.flutter = t * 5; p.bobY = Math.sin(t * 1.4) * 1.8;
      break;
    case 'left_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.left_turn, 0, 1) * Math.PI);
      p.turn = -0.26 * k; p.tailWag = -0.45 * k; p.flutter = t * 17;
      break;
    }
    case 'right_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.right_turn, 0, 1) * Math.PI);
      p.turn = 0.26 * k; p.tailWag = 0.45 * k; p.flutter = t * 17;
      break;
    }
    case 'eating': {
      const k = Math.sin(clamp(t / ONE_SHOTS.eating, 0, 1) * Math.PI);
      p.mouthOpen = k * 0.85; p.inflate = 1.0 + k * 0.08; p.flutter = t * 15;
      break;
    }
    case 'hungry':
      p.mouthOpen = 0.25 + Math.abs(Math.sin(t * 8.5)) * 0.45;
      p.eyeScale = 1.12; p.flutter = t * 14;
      break;
    case 'stress':
      p.inflate = 1.18; p.spikeLen = 1.45;
      p.jitterX = Math.sin(t * 44) * 1.4; p.jitterY = Math.cos(t * 40) * 1.2;
      p.flutter = t * 22;
      break;
    case 'fear':
      // Extra long cartoon spikes pop out + balloon inflation!
      p.inflate = 1.34 + Math.sin(t * 14) * 0.04;
      p.spikeLen = 2.05 + Math.sin(t * 14) * 0.12;
      p.jitterX = Math.sin(t * 50) * 1.9; p.jitterY = Math.cos(t * 46) * 1.6;
      p.eyeScale = 1.26; p.flutter = t * 26;
      break;
    case 'shock': {
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.inflate = 1.38 - (1 - k) * 0.06;
      p.spikeLen = 2.25;
      p.jitterX = Math.sin(t * 58) * 2.2 * k; p.jitterY = Math.cos(t * 54) * 1.8 * k;
      p.eyeScale = 1.34; p.mouthOpen = 0.55 * k; p.flutter = t * 28;
      break;
    }
    case 'happy':
      p.inflate = 1.06 + Math.sin(t * 6) * 0.04; p.spikeLen = 0.88;
      p.bobY = -Math.abs(Math.sin(t * 6.0)) * 2.8;
      p.flutter = t * 16; p.tailWag = Math.sin(t * 7) * 0.32;
      break;
    case 'sad':
      p.inflate = 0.92; p.spikeLen = 0.68;
      p.flutter = t * 4; p.bobY = 1.8 + Math.sin(t * 1.5) * 0.8;
      break;
  }
  return p;
}

function blendPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], t);
  return out;
}

export class Porcupinefish {
  static metadata = {
    name: 'Balloon Porcupinefish',
    category: 'fish',
    baseLength: 95,
    baseWidth: 76
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = samplePorcupinePose('breathing', 0);
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

    const target = samplePorcupinePose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _drawBroadFanTail(ctx, rx, pose) {
    ctx.save();
    ctx.translate(-rx * 0.9, pose.turn * 10);
    ctx.rotate(pose.tailWag * 0.65 + pose.turn * 0.55);

    // Broad spotted translucent fan tail
    ctx.beginPath();
    ctx.moveTo(4, -6);
    ctx.quadraticCurveTo(-10, -21, -23, -18);
    ctx.quadraticCurveTo(-27, 0, -23, 18);
    ctx.quadraticCurveTo(-10, 21, 4, 6);
    ctx.closePath();

    const tg = ctx.createLinearGradient(0, 0, -25, 0);
    tg.addColorStop(0, '#D4B28C');
    tg.addColorStop(1, 'rgba(246, 232, 206, 0.82)');
    ctx.fillStyle = tg;
    ctx.fill();

    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#4A3828';
    for (const [sx, sy] of [[-11, -8], [-17, -11], [-14, 0], [-19, 6], [-11, 9]]) {
      ctx.beginPath(); ctx.arc(sx, sy, 2.0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(120, 88, 56, 0.45)';
    ctx.lineWidth = 1.0;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-22, i * 5.2); ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = '#2B2016';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
  }

  _drawPectoralFans(ctx, rx, ry, pose) {
    for (const side of [-1, 1]) {
      const flap = Math.sin(pose.flutter + side * 0.4) * 0.4;
      ctx.save();
      ctx.translate(rx * 0.25, ry * 0.88 * side);
      ctx.rotate((0.62 + flap) * side);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(7, 13 * side, -7, 17 * side, -13, 9 * side);
      ctx.quadraticCurveTo(-5, 2 * side, 0, 0);
      ctx.closePath();
      ctx.fillStyle = 'rgba(245, 228, 198, 0.84)';
      ctx.fill();
      ctx.strokeStyle = '#2B2016';
      ctx.lineWidth = 1.9;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawPerimeterSpikes(ctx, rx, ry, pose) {
    // Prominent cartoon spikes radiating around the spherical silhouette (pop out extra long in shock/fear!)
    const count = 16;
    const len = 7.5 * pose.spikeLen;
    ctx.save();
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      // Leave clean face opening right at front mouth
      if (Math.abs(Math.atan2(Math.sin(ang), Math.cos(ang))) < 0.24) continue;
      const bx = Math.cos(ang) * (rx - 2);
      const by = Math.sin(ang) * (ry - 2);
      const tx = Math.cos(ang) * (rx + len);
      const ty = Math.sin(ang) * (ry + len);
      const px = -Math.sin(ang) * 3.2;
      const py = Math.cos(ang) * 3.2;

      ctx.beginPath();
      ctx.moveTo(bx + px, by + py);
      ctx.lineTo(tx, ty);
      ctx.lineTo(bx - px, by - py);
      ctx.closePath();

      const sg = ctx.createLinearGradient(bx, by, tx, ty);
      sg.addColorStop(0, '#C8A379');
      sg.addColorStop(0.55, '#FEF3C7');
      sg.addColorStop(1, '#FFFBEB');
      ctx.fillStyle = sg;
      ctx.fill();
      ctx.strokeStyle = '#2B2016';
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawSphericalBody(ctx, rx, ry, pose) {
    // Shadow
    ctx.save();
    ctx.translate(4, 7);
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(43, 32, 22, 0.22)';
    ctx.fill();
    ctx.restore();

    // Chubby spherical tan/sand porcupinefish body
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(rx * 0.16, -ry * 0.2, 4, 0, 0, Math.max(rx, ry) * 1.05);
    bg.addColorStop(0, '#F5DFB8');
    bg.addColorStop(0.45, '#CFA87A');
    bg.addColorStop(0.82, '#9E774E');
    bg.addColorStop(1, '#755333');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();

    // Warm dark saddle blotches
    ctx.fillStyle = 'rgba(84, 58, 36, 0.34)';
    ctx.beginPath(); ctx.ellipse(-rx * 0.18, 0, rx * 0.34, ry * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-rx * 0.68, 0, rx * 0.24, ry * 0.45, 0, 0, Math.PI * 2); ctx.fill();

    // Small dark freckle spots & dorsal cartoon spikes pointing slightly backward
    const dorsalSpikes = [
      [-0.1, -0.45], [-0.42, -0.42], [-0.65, -0.22],
      [-0.22, 0.0], [-0.52, 0.02], [-0.75, 0.0],
      [-0.1, 0.45], [-0.42, 0.42], [-0.65, 0.22],
      [0.14, -0.22], [0.14, 0.22]
    ];
    const dLen = 5.5 * pose.spikeLen;
    for (const [fx, fy] of dorsalSpikes) {
      const sx = fx * rx, sy = fy * ry;
      ctx.fillStyle = '#4A3624';
      ctx.beginPath(); ctx.arc(sx, sy, 2.3, 0, Math.PI * 2); ctx.fill();

      ctx.beginPath();
      ctx.moveTo(sx + 1.5, sy - 2.2);
      ctx.lineTo(sx - dLen, sy + fy * 3.5);
      ctx.lineTo(sx + 1.5, sy + 2.2);
      ctx.closePath();
      ctx.fillStyle = '#FFF7DC';
      ctx.fill();
      ctx.strokeStyle = '#2B2016';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    // Glossy chibi highlight
    ctx.fillStyle = 'rgba(255, 255, 245, 0.42)';
    ctx.beginPath(); ctx.ellipse(rx * 0.16, -ry * 0.28, rx * 0.32, ry * 0.15, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#2B2016';
    ctx.lineWidth = 3.0;
    ctx.stroke();

    // Cute beak-like smile / surprised O-mouth at nose
    ctx.save();
    ctx.translate(rx - 1, 0);
    ctx.fillStyle = '#FDA4AF';
    ctx.strokeStyle = '#2B2016';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(2.5 + pose.mouthOpen * 2.5, 0, 3.2 + pose.mouthOpen * 3.0, 4.4 + pose.mouthOpen * 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawEyesAndEmote(ctx, rx, ry, pose) {
    const st = this._state;

    for (const side of [-1, 1]) {
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 108, 142, 0.6)' : 'rgba(255, 132, 152, 0.4)';
      ctx.beginPath(); ctx.ellipse(rx * 0.34, ry * 0.68 * side, 6.0, 3.5, 0.2 * side, 0, Math.PI * 2); ctx.fill();
    }

    // GIANT glossy chibi porcupinefish eyes!
    for (const side of [-1, 1]) {
      const ex = rx * 0.56;
      const ey = ry * 0.46 * side;
      const r = 8.4 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#2B2016'; ctx.lineWidth = 3.0; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 1.5, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#2B2016'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-4.0, -4.0 * side); ctx.lineTo(3.0, 0); ctx.lineTo(-4.0, 4.0 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFDF7'; ctx.strokeStyle = '#2B2016'; ctx.lineWidth = 2.3;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.38 : (st === 'fear' ? r * 0.48 : r * 0.75);
        const ig = ctx.createRadialGradient(0.6, 0, 0.5, 0, 0, ir);
        ig.addColorStop(0, '#93C5FD'); ig.addColorStop(0.65, '#2563EB'); ig.addColorStop(1, '#1E3A8A');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(1.2, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.22 : (st === 'fear' ? r * 0.28 : r * 0.46);
        ctx.fillStyle = '#140F0A';
        ctx.beginPath(); ctx.arc(1.4, 0, pr, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(3.4, -2.4 * side, r * 0.28, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-1.2, 2.2 * side, r * 0.14, 0, Math.PI * 2); ctx.fill();

        if (st === 'hungry') {
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4 + this._totalTime * 4;
            const rad = k % 2 === 0 ? r * 0.52 : r * 0.2;
            if (k === 0) ctx.moveTo(1.0 + Math.cos(a) * rad, Math.sin(a) * rad);
            else ctx.lineTo(1.0 + Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath(); ctx.fill();
        } else if (st === 'relax') {
          ctx.fillStyle = '#CFA87A';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#2B2016'; ctx.lineWidth = 2.0;
          ctx.beginPath(); ctx.moveTo(-r, 0.4); ctx.quadraticCurveTo(0, 2.8, r, 0.4); ctx.stroke();
        } else if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.88)';
          ctx.beginPath(); ctx.ellipse(-1.6, 3.2 * side, 3.4, 2.0, 0.3 * side, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'happy' || st === 'hungry' || st === 'shock' || st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(rx * 0.72, -ry - 14);
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
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#2B2016'; ctx.lineWidth = 1.5;
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
    const rx = 33 * pose.inflate;
    const ry = 30.5 * (pose.inflate * 1.03 - 0.03);

    ctx.save();
    ctx.translate(this.x + pose.jitterX, this.y + pose.jitterY + pose.bobY);
    ctx.rotate(this.angle + pose.turn * 0.25);
    ctx.scale(this.scale, this.scale);

    this._drawPectoralFans(ctx, rx, ry, pose);
    this._drawBroadFanTail(ctx, rx, pose);
    this._drawPerimeterSpikes(ctx, rx, ry, pose);
    this._drawSphericalBody(ctx, rx, ry, pose);
    this._drawEyesAndEmote(ctx, rx, ry, pose);

    ctx.restore();
  }
}

export default Porcupinefish;
