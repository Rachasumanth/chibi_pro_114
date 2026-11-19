/**
 * Koifish ("Kohaku Koi") — Standalone 2D Top-Down Expressive Chibi ES Module
 * Dimensions: 145x58 | Category: fish | Zero external dependencies (Canvas 2D API)
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const STATE_ALIASES = { idle: 'breathing', hunger: 'hungry' };
const ONE_SHOT_DURATIONS = { left_turn: 0.65, right_turn: 0.65, eating: 0.55, shock: 0.8 };
const BLEND_DURATION = 0.15;

function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

function normalizeState(name) {
  if (typeof name !== 'string') return null;
  const k = name.trim().toLowerCase();
  const mapped = STATE_ALIASES[k] || k;
  return VALID_STATES.has(mapped) ? mapped : null;
}

function canTransition(fromState, toState) {
  if (!toState) return false;
  if (fromState === 'shock') return toState === 'fear' || toState === 'stress';
  if (fromState === 'fear') {
    if (
      toState === 'left_turn' || toState === 'right_turn' ||
      toState === 'relax' || toState === 'happy' ||
      toState === 'eating' || toState === 'hungry' || toState === 'sad'
    ) return false;
  }
  return true;
}

function samplePose(state, t, p) {
  const pose = {
    waveAmp: 0.09, waveFreq: 2.8, turnBend: 0, finSweep: 0.16, finFreq: 2.6,
    squashX: 1, squashY: 1, mouthOpen: 0, shiver: 0, bobY: 0, eyeScale: 1
  };
  switch (state) {
    case 'breathing':
      pose.waveAmp = 0.05; pose.waveFreq = 1.9;
      pose.squashX = 1 + Math.sin(t * 2.2) * 0.02;
      pose.squashY = 1 - Math.sin(t * 2.2) * 0.02;
      break;
    case 'swimming':
      pose.waveAmp = 0.16; pose.waveFreq = 5.6; pose.finSweep = 0.30; pose.finFreq = 5.2;
      break;
    case 'relax':
      pose.waveAmp = 0.03; pose.waveFreq = 1.2; pose.finSweep = 0.07;
      break;
    case 'left_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.10; pose.waveFreq = 4.6; pose.turnBend = -0.58 * env;
      break;
    }
    case 'right_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.10; pose.waveFreq = 4.6; pose.turnBend = 0.58 * env;
      break;
    }
    case 'eating': {
      const ch = Math.max(0, Math.sin(clamp(p, 0, 1) * Math.PI * 3));
      pose.mouthOpen = ch; pose.waveAmp = 0.12; pose.waveFreq = 5.2;
      pose.squashX = 1 + ch * 0.05; pose.squashY = 1 - ch * 0.04;
      break;
    }
    case 'hungry':
      pose.waveAmp = 0.13; pose.waveFreq = 4.8; pose.mouthOpen = Math.max(0, Math.sin(t * 7.8)) * 0.85; pose.eyeScale = 1.12;
      break;
    case 'stress':
      pose.waveAmp = 0.14; pose.waveFreq = 11.2; pose.shiver = 1.5;
      break;
    case 'fear':
      pose.waveAmp = 0.20; pose.waveFreq = 13.4; pose.shiver = 2.2; pose.eyeScale = 1.24;
      break;
    case 'shock': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.02; pose.shiver = 2.0 * env; pose.eyeScale = 1.34; pose.mouthOpen = 0.9 * env;
      pose.squashX = 0.88 + (1 - env) * 0.12; pose.squashY = 1.13 - (1 - env) * 0.13;
      break;
    }
    case 'happy':
      pose.waveAmp = 0.15; pose.waveFreq = 7.0; pose.finSweep = 0.34; pose.bobY = Math.sin(t * 6.4) * 1.6;
      break;
    case 'sad':
      pose.waveAmp = 0.035; pose.waveFreq = 1.4; pose.finSweep = 0.06;
      break;
  }
  return pose;
}

export class Koifish {
  static metadata = {
    name: 'Kohaku Koi',
    category: 'fish',
    baseLength: 145,
    baseWidth: 58
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this.state = 'breathing'; this.previousState = 'breathing';
    this.time = 0; this.stateTime = 0; this.phase = 0;
    this._blendElapsed = BLEND_DURATION;
    this._fromPose = samplePose('breathing', 0, 0);
    this._pose = samplePose('breathing', 0, 0);
    this._listeners = new Map();
  }

  getState() { return this.state; }
  setAngle(r) { if (typeof r === 'number' && Number.isFinite(r)) this.angle = r; }
  setDirection(dx, dy) { if (typeof dx === 'number' && typeof dy === 'number' && (dx !== 0 || dy !== 0)) this.angle = Math.atan2(dy, dx); }

  onFinished(name, callback) {
    const norm = normalizeState(name);
    if (!norm || typeof callback !== 'function') return;
    if (!this._listeners.has(norm)) this._listeners.set(norm, []);
    this._listeners.get(norm).push(callback);
  }

  play(name) {
    const next = normalizeState(name);
    if (!next) return false;
    if (next === this.state) {
      if (ONE_SHOT_DURATIONS[next]) this.stateTime = 0;
      return true;
    }
    if (!canTransition(this.state, next)) return false;
    if (!ONE_SHOT_DURATIONS[this.state]) this.previousState = this.state;
    this._fromPose = { ...this._pose };
    this._blendElapsed = 0;
    this.state = next;
    this.stateTime = 0;
    return true;
  }

  update(dt = 0.016) {
    const step = clamp(typeof dt === 'number' && Number.isFinite(dt) ? dt : 0.016, 0, 0.1);
    this.time += step; this.stateTime += step;
    const dur = ONE_SHOT_DURATIONS[this.state];
    const progress = dur ? clamp(this.stateTime / dur, 0, 1) : 0;
    const target = samplePose(this.state, this.time, progress);
    if (this._blendElapsed < BLEND_DURATION) {
      this._blendElapsed = Math.min(BLEND_DURATION, this._blendElapsed + step);
      const k = easeInOutCubic(this._blendElapsed / BLEND_DURATION);
      for (const key in target) this._pose[key] = lerp(this._fromPose[key], target[key], k);
    } else {
      this._pose = target;
    }
    this.phase += step * this._pose.waveFreq;
    if (dur && this.stateTime >= dur) {
      const done = this.state;
      this._fromPose = { ...this._pose };
      this._blendElapsed = 0;
      this.state = this.previousState || 'breathing';
      this.stateTime = 0;
      const cbs = this._listeners.get(done);
      if (cbs) for (const cb of cbs) cb(done);
    }
  }

  _buildSpine(L, W) {
    // Muscular graceful carp torpedo with broad shoulders
    const count = 9;
    const bodyL = L * 0.76;
    const noseX = L * 0.45;
    const widths = [0.0, 0.25, 0.40, 0.44, 0.40, 0.32, 0.22, 0.14, 0.08];
    const pts = [];
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const x = noseX - u * bodyL;
      const wave = Math.sin(this.phase - u * 3.4) * this._pose.waveAmp * L * (0.06 + u * u * 0.90);
      const bend = this._pose.turnBend * W * (u * u * 0.88);
      pts.push({ x, y: wave + bend, hw: widths[i] * W, u });
    }
    return pts;
  }

  _traceBody(ctx, pts, L, W) {
    const n = pts.length;
    const top = [], bot = [];
    for (let i = 1; i < n; i++) {
      const pr = pts[i - 1], cr = pts[i], nx = pts[Math.min(n - 1, i + 1)];
      const dx = nx.x - pr.x, dy = nx.y - pr.y;
      const d = Math.hypot(dx, dy) || 1;
      const ux = -dy / d, uy = dx / d;
      top.push({ x: cr.x + ux * cr.hw, y: cr.y + uy * cr.hw });
      bot.push({ x: cr.x - ux * cr.hw, y: cr.y - uy * cr.hw });
    }
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.bezierCurveTo(pts[0].x + 2, pts[0].y - W * 0.16, top[0].x + 5, top[0].y - 2, top[0].x, top[0].y);
    for (let i = 0; i < top.length - 1; i++) {
      ctx.quadraticCurveTo(top[i].x, top[i].y, (top[i].x + top[i + 1].x) * 0.5, (top[i].y + top[i + 1].y) * 0.5);
    }
    ctx.lineTo(top[top.length - 1].x, top[top.length - 1].y);
    ctx.lineTo(bot[bot.length - 1].x, bot[bot.length - 1].y);
    for (let i = bot.length - 1; i > 0; i--) {
      ctx.quadraticCurveTo(bot[i].x, bot[i].y, (bot[i].x + bot[i - 1].x) * 0.5, (bot[i].y + bot[i - 1].y) * 0.5);
    }
    ctx.bezierCurveTo(bot[0].x + 5, bot[0].y + 2, pts[0].x + 2, pts[0].y + W * 0.16, pts[0].x, pts[0].y);
    ctx.closePath();
  }

  _drawSnowyVeinedFins(ctx, pts, L, W) {
    // Broad snowy-white translucent koi pectorals + pelvic fins with crisp ivory fin rays
    const flutter = Math.sin(this.time * this._pose.finFreq) * this._pose.finSweep;

    // Pectoral wings
    const pAnchor = pts[2];
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(pAnchor.x + 2, pAnchor.y + side * pts[2].hw * 0.80);
      ctx.rotate(side * (0.48 + flutter * (side > 0 ? 1 : -0.85)));

      const fL = L * 0.22, fW = W * 0.34;
      const grad = ctx.createRadialGradient(0, 0, 2, -fL * 0.3, side * fW * 0.4, fL * 1.1);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
      grad.addColorStop(0.65, 'rgba(244, 248, 255, 0.80)');
      grad.addColorStop(1, 'rgba(225, 236, 250, 0.42)');

      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.bezierCurveTo(fL * 0.25, side * fW * 0.65, -fL * 0.45, side * fW * 1.15, -fL * 0.98, side * fW * 0.60);
      ctx.bezierCurveTo(-fL * 0.98, side * fW * 0.14, -fL * 0.40, -side * fW * 0.04, 2, 0);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Delicate translucent fin veins
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(176, 194, 218, 0.68)';
      ctx.lineWidth = 0.95;
      for (let r = 0; r < 6; r++) {
        const k = r / 5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-fL * 0.35 * k, side * fW * 0.50, -fL * (0.30 + k * 0.64), side * fW * (0.35 + (1 - k) * 0.56));
        ctx.stroke();
      }
      ctx.restore();

      ctx.strokeStyle = '#332C30';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }

    // Smaller pelvic fins further back
    const vAnchor = pts[5];
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(vAnchor.x, vAnchor.y + side * pts[5].hw * 0.78);
      ctx.rotate(side * (0.68 - flutter * 0.4));
      ctx.fillStyle = 'rgba(248, 252, 255, 0.76)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-8, side * 12, -16, side * 7);
      ctx.quadraticCurveTo(-12, side * 2, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#332C30';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawCaudalFin(ctx, pts, L, W) {
    const tail = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const dir = Math.atan2(tail.y - prev.y, tail.x - prev.x);
    const wag = Math.sin(this.phase - 3.8) * 0.28 + this._pose.turnBend * 0.40;

    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(dir + wag);

    const tL = L * 0.25, tH = W * 0.42;
    const g = ctx.createLinearGradient(0, 0, tL, 0);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    g.addColorStop(0.65, 'rgba(240, 246, 255, 0.75)');
    g.addColorStop(1, 'rgba(225, 236, 252, 0.40)');

    ctx.beginPath();
    ctx.moveTo(0, -W * 0.08);
    ctx.bezierCurveTo(tL * 0.35, -tH * 0.85, tL * 0.92, -tH * 1.0, tL * 1.04, -tH * 0.56);
    ctx.quadraticCurveTo(tL * 0.62, 0, tL * 1.04, tH * 0.56);
    ctx.bezierCurveTo(tL * 0.92, tH * 1.0, tL * 0.35, tH * 0.85, 0, W * 0.08);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    // Veined rays
    ctx.strokeStyle = 'rgba(176, 194, 218, 0.65)';
    ctx.lineWidth = 0.9;
    for (let r = -4; r <= 4; r++) {
      ctx.beginPath();
      ctx.moveTo(1, r * 0.8);
      ctx.lineTo(tL * (0.70 + Math.abs(r) * 0.07), r * tH * 0.20);
      ctx.stroke();
    }

    ctx.strokeStyle = '#332C30';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
  }

  _drawAnimatedBarbels(ctx, pts, L, W) {
    // Pair of graceful animated koi mouth barbels
    const nose = pts[0];
    const wiggle = Math.sin(this.time * 5.2) * 3.5;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.strokeStyle = '#FF9C6B';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(nose.x - 2, nose.y + side * 4.5);
      ctx.bezierCurveTo(
        nose.x + 6, nose.y + side * (11 + wiggle * 0.4),
        nose.x + 3, nose.y + side * (16 - wiggle * 0.5),
        nose.x - 4, nose.y + side * (18 + wiggle * 0.6)
      );
      ctx.stroke();
      ctx.strokeStyle = '#4A2218';
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawKohakuHiPatches(ctx, pts, L, W) {
    // Organic scalloped vermilion/crimson-orange Kohaku Hi patches
    const hiGrad = ctx.createLinearGradient(pts[0].x, -W * 0.4, pts[7].x, W * 0.4);
    hiGrad.addColorStop(0, '#FF4B1F');
    hiGrad.addColorStop(0.5, '#EA2B16');
    hiGrad.addColorStop(1, '#CC1E10');
    ctx.fillStyle = hiGrad;

    // 1. Classic Tancho/forehead crimson crown patch
    ctx.beginPath();
    ctx.ellipse(pts[1].x - 2, pts[1].y, 13, 10, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // 2. Large organic scalloped mid-back saddle patch
    ctx.beginPath();
    ctx.moveTo(pts[2].x - 4, pts[2].y - 22);
    ctx.bezierCurveTo(pts[3].x + 10, pts[3].y - 28, pts[5].x + 6, pts[5].y - 22, pts[5].x - 6, pts[5].y - 6);
    ctx.bezierCurveTo(pts[5].x - 10, pts[5].y + 12, pts[4].x - 2, pts[4].y + 24, pts[3].x + 2, pts[3].y + 18);
    ctx.bezierCurveTo(pts[2].x + 4, pts[2].y + 12, pts[2].x - 8, pts[2].y - 8, pts[2].x - 4, pts[2].y - 22);
    ctx.closePath();
    ctx.fill();

    // 3. Rear flank crimson patch near tail
    ctx.beginPath();
    ctx.ellipse(pts[6].x - 2, pts[6].y + 4, 14, 9.5, -0.22, 0, Math.PI * 2);
    ctx.fill();

    // Delicate pearlescent scale pattern across body
    ctx.strokeStyle = 'rgba(205, 216, 232, 0.34)';
    ctx.lineWidth = 0.9;
    for (let i = 2; i < pts.length - 1; i++) {
      for (let s = -2; s <= 2; s++) {
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y + s * (pts[i].hw * 0.38), 4.6, -Math.PI * 0.42, Math.PI * 0.42);
        ctx.stroke();
      }
    }
  }

  _drawEyesAndEmotes(ctx, pts, L, W) {
    const head = pts[1];
    const ex = head.x + 4;
    const sep = pts[1].hw * 0.78;
    const baseR = 5.6 * this._pose.eyeScale;
    const st = this.state;

    for (const side of [-1, 1]) {
      const bg = ctx.createRadialGradient(ex - 5, head.y + side * (sep + 2), 0.5, ex - 5, head.y + side * (sep + 2), 6);
      bg.addColorStop(0, 'rgba(255, 114, 146, 0.62)');
      bg.addColorStop(1, 'rgba(255, 114, 146, 0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(ex - 5, head.y + side * (sep + 2), 5.5, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this._pose.mouthOpen > 0.05) {
      const m = this._pose.mouthOpen;
      ctx.fillStyle = '#52141E';
      ctx.beginPath();
      ctx.ellipse(pts[0].x - 1, pts[0].y, 2.6 * m + 1.2, 3.4 * m + 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ey = head.y + side * sep;
      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#2B2226'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, baseR * 0.78, -Math.PI * 0.42, Math.PI * 0.42); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#2B2226'; ctx.lineWidth = 2.3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-baseR * 0.55, -baseR * 0.55); ctx.lineTo(baseR * 0.45, 0); ctx.lineTo(-baseR * 0.55, baseR * 0.55); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, baseR, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFDF9'; ctx.fill();
        ctx.strokeStyle = '#2B2226'; ctx.lineWidth = 1.6; ctx.stroke();

        const irisR = st === 'shock' ? baseR * 0.36 : baseR * 0.75;
        const ig = ctx.createRadialGradient(0.4, -0.4, 0.5, 0, 0, irisR);
        ig.addColorStop(0, '#18141A');
        ig.addColorStop(0.55, '#2A1D22');
        ig.addColorStop(0.84, '#F5A623');
        ig.addColorStop(1, '#FFE484');
        ctx.beginPath(); ctx.arc(0.4, 0, irisR, 0, Math.PI * 2); ctx.fillStyle = ig; ctx.fill();

        if (st === 'hungry') {
          ctx.fillStyle = '#FFF8B4';
          this._star(ctx, 0.7, -0.3, baseR * 0.55);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(baseR * 0.28, -baseR * 0.30, baseR * 0.30, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(-baseR * 0.24, baseR * 0.26, baseR * 0.14, 0, Math.PI * 2); ctx.fill();
        }
        if (st === 'relax') {
          ctx.fillStyle = '#F2F5FA';
          ctx.beginPath(); ctx.arc(0, 0, baseR + 0.3, Math.PI * 0.65, Math.PI * 1.35); ctx.closePath(); ctx.fill();
        } else if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(130, 232, 255, 0.88)';
          ctx.beginPath(); ctx.ellipse(-baseR * 0.3, side * baseR * 0.45, baseR * 0.36, baseR * 0.22, 0.25, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'happy') {
      const pulse = 0.8 + Math.sin(this.time * 8) * 0.25;
      ctx.fillStyle = '#FFE45E';
      this._star(ctx, pts[0].x + 8, -22, 5.0 * pulse);
      this._star(ctx, pts[2].x, 28, 4.0 * pulse);
    } else if (st === 'shock') {
      ctx.font = 'bold 16px sans-serif';
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.2;
      ctx.strokeText('!', pts[0].x + 10, -14);
      ctx.fillStyle = '#FF3344'; ctx.fillText('!', pts[0].x + 10, -14);
    } else if (st === 'fear' || st === 'stress') {
      ctx.fillStyle = '#7CE4FF'; ctx.strokeStyle = '#1D5486'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(pts[1].x + 2, -26);
      ctx.quadraticCurveTo(pts[1].x - 6, -30, pts[1].x - 9, -26);
      ctx.quadraticCurveTo(pts[1].x - 6, -22, pts[1].x + 2, -26);
      ctx.fill(); ctx.stroke();
    }
  }

  _star(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const rad = i % 2 === 0 ? r : r * 0.34;
      const px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  draw(ctx) {
    if (!ctx) return;
    const L = Koifish.metadata.baseLength;
    const W = Koifish.metadata.baseWidth;
    const shX = this._pose.shiver ? Math.sin(this.time * 58) * this._pose.shiver : 0;
    const shY = this._pose.shiver ? Math.cos(this.time * 66) * this._pose.shiver : 0;

    ctx.save();
    ctx.translate(this.x + shX, this.y + this._pose.bobY + shY);
    ctx.rotate(this.angle);
    ctx.scale(this.scale * this._pose.squashX, this.scale * this._pose.squashY);

    const pts = this._buildSpine(L, W);

    // Shadow
    ctx.save();
    ctx.translate(-3, 5);
    this._traceBody(ctx, pts, L, W);
    ctx.fillStyle = 'rgba(12, 24, 38, 0.22)';
    ctx.fill();
    ctx.restore();

    this._drawAnimatedBarbels(ctx, pts, L, W);
    this._drawCaudalFin(ctx, pts, L, W);
    this._drawSnowyVeinedFins(ctx, pts, L, W);

    // Pearl-white muscular koi body
    this._traceBody(ctx, pts, L, W);
    const bg = ctx.createLinearGradient(pts[0].x, -W * 0.45, pts[0].x, W * 0.45);
    bg.addColorStop(0, '#FFFFFF');
    bg.addColorStop(0.55, '#F5F7FC');
    bg.addColorStop(1, '#D5DFEE');
    ctx.fillStyle = bg;
    ctx.fill();

    // Clipped Kohaku Hi patches + scales + glossy dorsal highlight
    ctx.save();
    this._traceBody(ctx, pts, L, W);
    ctx.clip();
    this._drawKohakuHiPatches(ctx, pts, L, W);

    const hl = ctx.createLinearGradient(pts[1].x, -W * 0.28, pts[6].x, W * 0.1);
    hl.addColorStop(0, 'rgba(255, 255, 255, 0.60)');
    hl.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.ellipse(pts[3].x, pts[3].y - W * 0.14, L * 0.24, W * 0.11, -0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bold outline
    this._traceBody(ctx, pts, L, W);
    ctx.strokeStyle = '#30262A';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Translucent snowy dorsal fin wave
    const sway = Math.sin(this.phase - 1.4) * W * 0.10;
    ctx.beginPath();
    ctx.moveTo(pts[3].x + 4, pts[3].y);
    ctx.bezierCurveTo(pts[5].x, pts[5].y - W * 0.14 + sway, pts[6].x, pts[6].y - W * 0.10 + sway * 1.2, pts[7].x, pts[7].y + sway);
    ctx.bezierCurveTo(pts[5].x, pts[5].y + W * 0.08 + sway * 0.5, pts[4].x, pts[4].y + W * 0.06, pts[3].x + 4, pts[3].y);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.fill();
    ctx.strokeStyle = '#30262A';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    this._drawEyesAndEmotes(ctx, pts, L, W);
    ctx.restore();
  }
}

export default Koifish;
