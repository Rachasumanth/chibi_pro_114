/**
 * Bettafish ("Siamese Betta") — Standalone 2D Top-Down Expressive Chibi ES Module
 * Dimensions: 75x42 | Category: fish | Zero external dependencies (Canvas 2D API)
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
    waveAmp: 0.11, waveFreq: 3.2, turnBend: 0,
    finSweep: 0.22, finFreq: 2.8, veilFlow: 0.24,
    squashX: 1, squashY: 1, mouthOpen: 0, shiver: 0, bobY: 0, eyeScale: 1
  };
  switch (state) {
    case 'breathing':
      pose.waveAmp = 0.07; pose.waveFreq = 2.0; pose.veilFlow = 0.18;
      pose.squashX = 1 + Math.sin(t * 2.5) * 0.02;
      pose.squashY = 1 - Math.sin(t * 2.5) * 0.02;
      break;
    case 'swimming':
      pose.waveAmp = 0.18; pose.waveFreq = 6.4; pose.finSweep = 0.36; pose.finFreq = 6.0; pose.veilFlow = 0.42;
      pose.squashX = 1.04; pose.squashY = 0.96;
      break;
    case 'relax':
      pose.waveAmp = 0.04; pose.waveFreq = 1.3; pose.finSweep = 0.10; pose.veilFlow = 0.12;
      break;
    case 'left_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.13; pose.waveFreq = 4.8; pose.turnBend = -0.65 * env; pose.veilFlow = 0.46;
      break;
    }
    case 'right_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.13; pose.waveFreq = 4.8; pose.turnBend = 0.65 * env; pose.veilFlow = 0.46;
      break;
    }
    case 'eating': {
      const ch = Math.max(0, Math.sin(clamp(p, 0, 1) * Math.PI * 3));
      pose.waveAmp = 0.12; pose.waveFreq = 5.6; pose.mouthOpen = ch;
      pose.squashX = 1 + ch * 0.06; pose.squashY = 1 - ch * 0.04;
      break;
    }
    case 'hungry':
      pose.waveAmp = 0.14; pose.waveFreq = 5.0; pose.mouthOpen = Math.max(0, Math.sin(t * 8)) * 0.8; pose.eyeScale = 1.12;
      break;
    case 'stress':
      pose.waveAmp = 0.15; pose.waveFreq = 11.5; pose.shiver = 1.2; pose.finFreq = 9.5;
      break;
    case 'fear':
      pose.waveAmp = 0.22; pose.waveFreq = 13.5; pose.shiver = 1.9; pose.eyeScale = 1.24; pose.veilFlow = 0.55;
      break;
    case 'shock': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.03; pose.shiver = 1.7 * env; pose.eyeScale = 1.32; pose.mouthOpen = 0.85 * env;
      pose.squashX = 0.88 + (1 - env) * 0.12; pose.squashY = 1.14 - (1 - env) * 0.14;
      break;
    }
    case 'happy':
      pose.waveAmp = 0.16; pose.waveFreq = 7.4; pose.finSweep = 0.38; pose.veilFlow = 0.45;
      pose.bobY = Math.sin(t * 6.8) * 1.3;
      break;
    case 'sad':
      pose.waveAmp = 0.04; pose.waveFreq = 1.5; pose.finSweep = 0.06; pose.veilFlow = 0.08;
      break;
  }
  return pose;
}

export class Bettafish {
  static metadata = {
    name: 'Siamese Betta',
    category: 'fish',
    baseLength: 75,
    baseWidth: 42
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
    this.state = 'breathing';
    this.previousState = 'breathing';
    this.time = 0;
    this.stateTime = 0;
    this.phase = 0;
    this._blendElapsed = BLEND_DURATION;
    this._fromPose = samplePose('breathing', 0, 0);
    this._pose = samplePose('breathing', 0, 0);
    this._listeners = new Map();
  }

  getState() { return this.state; }
  setAngle(radians) { if (typeof radians === 'number' && Number.isFinite(radians)) this.angle = radians; }
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
    this.time += step;
    this.stateTime += step;
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
    // Slender chibi betta torso (front 58% of L, leaving 42% for giant flowing veil tail)
    const count = 8;
    const bodyL = L * 0.56;
    const noseX = L * 0.44;
    const widths = [0.0, 0.21, 0.30, 0.29, 0.24, 0.18, 0.12, 0.07];
    const pts = [];
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const x = noseX - u * bodyL;
      const wave = Math.sin(this.phase - u * 2.8) * this._pose.waveAmp * L * (0.08 + u * u * 0.85);
      const bend = this._pose.turnBend * W * (u * u * 0.85);
      pts.push({ x, y: wave + bend, hw: widths[i] * W, u });
    }
    return pts;
  }

  _traceBody(ctx, pts, L, W) {
    const n = pts.length;
    const top = [];
    const bot = [];
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
    ctx.bezierCurveTo(pts[0].x + 1, pts[0].y - W * 0.16, top[0].x + 3, top[0].y - 1, top[0].x, top[0].y);
    for (let i = 0; i < top.length - 1; i++) {
      ctx.quadraticCurveTo(top[i].x, top[i].y, (top[i].x + top[i + 1].x) * 0.5, (top[i].y + top[i + 1].y) * 0.5);
    }
    ctx.lineTo(top[top.length - 1].x, top[top.length - 1].y);
    ctx.lineTo(bot[bot.length - 1].x, bot[bot.length - 1].y);
    for (let i = bot.length - 1; i > 0; i--) {
      ctx.quadraticCurveTo(bot[i].x, bot[i].y, (bot[i].x + bot[i - 1].x) * 0.5, (bot[i].y + bot[i - 1].y) * 0.5);
    }
    ctx.bezierCurveTo(bot[0].x + 3, bot[0].y + 1, pts[0].x + 1, pts[0].y + W * 0.16, pts[0].x, pts[0].y);
    ctx.closePath();
  }

  _drawVeilTail(ctx, pts, L, W) {
    // Huge flowing pleated multi-layered veil caudal fin with iridescent blue-to-crimson sheen
    const tail = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const baseAngle = Math.atan2(tail.y - prev.y, tail.x - prev.x);

    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(baseAngle);

    // 3 overlapping translucent silk veil layers
    const layers = [
      { len: L * 0.48, spread: W * 0.62, phaseOff: 0.4, c0: 'rgba(42, 92, 230, 0.72)', c1: 'rgba(186, 26, 98, 0.76)', c2: 'rgba(255, 66, 118, 0.52)' },
      { len: L * 0.44, spread: W * 0.50, phaseOff: 0.0, c0: 'rgba(58, 134, 255, 0.85)', c1: 'rgba(220, 28, 86, 0.88)', c2: 'rgba(255, 110, 152, 0.72)' },
      { len: L * 0.36, spread: W * 0.34, phaseOff: -0.5, c0: 'rgba(102, 212, 255, 0.72)', c1: 'rgba(248, 56, 110, 0.80)', c2: 'rgba(255, 178, 206, 0.58)' }
    ];

    for (const lay of layers) {
      const sway1 = Math.sin(this.phase - 3.0 + lay.phaseOff) * W * this._pose.veilFlow;
      const sway2 = Math.sin(this.phase - 4.4 + lay.phaseOff) * W * this._pose.veilFlow * 1.35;

      const grad = ctx.createLinearGradient(0, 0, lay.len, sway2);
      grad.addColorStop(0, lay.c0);
      grad.addColorStop(0.55, lay.c1);
      grad.addColorStop(1, lay.c2);

      ctx.beginPath();
      ctx.moveTo(0, -W * 0.06);
      ctx.bezierCurveTo(
        lay.len * 0.32, -lay.spread * 0.85 + sway1 * 0.4,
        lay.len * 0.78, -lay.spread * 0.98 + sway1,
        lay.len, -lay.spread * 0.42 + sway2
      );
      // Scalloped pleated trailing edge
      const pleats = 6;
      for (let i = 0; i < pleats; i++) {
        const t0 = i / pleats;
        const t1 = (i + 1) / pleats;
        const y0 = lerp(-lay.spread * 0.42, lay.spread * 0.42, t0) + sway2;
        const y1 = lerp(-lay.spread * 0.42, lay.spread * 0.42, t1) + sway2;
        const midY = (y0 + y1) * 0.5;
        const dip = Math.sin((t0 + 0.08) * Math.PI * pleats) * 2.2;
        ctx.quadraticCurveTo(lay.len + 3.5 + dip, midY, lay.len - 1.5, y1);
      }
      ctx.bezierCurveTo(
        lay.len * 0.78, lay.spread * 0.98 + sway1,
        lay.len * 0.32, lay.spread * 0.85 + sway1 * 0.4,
        0, W * 0.06
      );
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Delicate radiating iridescent fin rays
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(180, 238, 255, 0.45)';
      ctx.lineWidth = 0.75;
      for (let r = -4; r <= 4; r++) {
        const frac = r / 4;
        ctx.beginPath();
        ctx.moveTo(0, frac * W * 0.05);
        ctx.quadraticCurveTo(
          lay.len * 0.52, frac * lay.spread * 0.55 + sway1 * 0.6,
          lay.len * 0.96, frac * lay.spread * 0.55 + sway2
        );
        ctx.stroke();
      }
      ctx.restore();

      ctx.strokeStyle = 'rgba(26, 14, 52, 0.65)';
      ctx.lineWidth = 1.25;
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawFlowingPectorals(ctx, pts, L, W) {
    const anchor = pts[2];
    const sweep = Math.sin(this.time * this._pose.finFreq) * this._pose.finSweep;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(anchor.x + 1, anchor.y + side * W * 0.24);
      ctx.rotate(side * (0.48 + sweep * (side > 0 ? 1 : -0.9)));

      const fL = L * 0.30;
      const fW = W * 0.36;
      const grad = ctx.createLinearGradient(0, 0, -fL, side * fW);
      grad.addColorStop(0, 'rgba(66, 144, 255, 0.88)');
      grad.addColorStop(0.55, 'rgba(214, 34, 96, 0.80)');
      grad.addColorStop(1, 'rgba(255, 138, 178, 0.42)');

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(fL * 0.22, side * fW * 0.58, -fL * 0.32, side * fW * 1.15, -fL * 0.96, side * fW * 0.72);
      ctx.bezierCurveTo(-fL * 1.05, side * fW * 0.28, -fL * 0.55, side * fW * 0.05, 0, 0);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(205, 240, 255, 0.52)';
      ctx.lineWidth = 0.7;
      for (let i = 1; i <= 4; i++) {
        const k = i / 5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-fL * 0.32 * k, side * fW * 0.52, -fL * (0.35 + k * 0.55), side * fW * (0.38 + (1 - k) * 0.45));
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(24, 15, 50, 0.78)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawRibbonDorsal(ctx, pts, L, W) {
    // Flowing pleated ribbon dorsal fin running along top of spine
    const sway1 = Math.sin(this.phase - 1.5) * W * 0.22;
    const sway2 = Math.sin(this.phase - 2.9) * W * 0.30;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[2].x, pts[2].y);
    ctx.bezierCurveTo(
      pts[4].x, pts[4].y - W * 0.24 + sway1,
      pts[6].x - L * 0.06, pts[6].y - W * 0.22 + sway2,
      pts[7].x - L * 0.14, pts[7].y + sway2 * 1.15
    );
    ctx.bezierCurveTo(
      pts[6].x, pts[6].y + W * 0.12 + sway1 * 0.6,
      pts[4].x, pts[4].y + W * 0.10 + sway1 * 0.4,
      pts[2].x, pts[2].y
    );
    ctx.closePath();

    const dg = ctx.createLinearGradient(pts[2].x, pts[2].y, pts[7].x - L * 0.14, pts[7].y);
    dg.addColorStop(0, 'rgba(64, 152, 255, 0.90)');
    dg.addColorStop(0.5, 'rgba(218, 32, 92, 0.88)');
    dg.addColorStop(1, 'rgba(255, 118, 166, 0.68)');
    ctx.fillStyle = dg;
    ctx.fill();
    ctx.strokeStyle = '#1D123A';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.restore();
  }

  _drawEyesAndEmotes(ctx, pts, L, W) {
    const head = pts[1];
    const ex = head.x + L * 0.035;
    const sep = W * 0.20;
    const baseR = W * 0.135 * this._pose.eyeScale;
    const st = this.state;

    // Rosy cheek blushes
    for (const side of [-1, 1]) {
      const bg = ctx.createRadialGradient(ex - 4, head.y + side * (sep + 2.5), 0.5, ex - 4, head.y + side * (sep + 2.5), 4.5);
      bg.addColorStop(0, 'rgba(255, 112, 168, 0.65)');
      bg.addColorStop(1, 'rgba(255, 112, 168, 0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(ex - 4, head.y + side * (sep + 2.5), 4.2, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this._pose.mouthOpen > 0.05) {
      const m = this._pose.mouthOpen;
      ctx.fillStyle = '#4B122C';
      ctx.beginPath();
      ctx.ellipse(pts[0].x - 0.5, pts[0].y, 1.8 * m + 0.9, 2.3 * m + 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ey = head.y + side * sep;
      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#190F33';
        ctx.lineWidth = 2.1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, baseR * 0.78, -Math.PI * 0.42, Math.PI * 0.42);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#190F33';
        ctx.lineWidth = 2.0;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-baseR * 0.5, -baseR * 0.5);
        ctx.lineTo(baseR * 0.45, 0);
        ctx.lineTo(-baseR * 0.5, baseR * 0.5);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, baseR, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFDF9';
        ctx.fill();
        ctx.strokeStyle = '#190F33';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const irisR = st === 'shock' ? baseR * 0.35 : baseR * 0.74;
        const ig = ctx.createRadialGradient(0.4, -0.4, 0.5, 0, 0, irisR);
        ig.addColorStop(0, '#130A2B');
        ig.addColorStop(0.58, '#1B1145');
        ig.addColorStop(0.86, '#4EC5FF');
        ig.addColorStop(1, '#9EE8FF');
        ctx.beginPath();
        ctx.arc(0.35, 0, irisR, 0, Math.PI * 2);
        ctx.fillStyle = ig;
        ctx.fill();

        if (st === 'hungry') {
          ctx.fillStyle = '#FFF9BE';
          this._star(ctx, 0.6, -0.3, baseR * 0.56);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(baseR * 0.28, -baseR * 0.3, baseR * 0.30, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(-baseR * 0.24, baseR * 0.26, baseR * 0.14, 0, Math.PI * 2);
          ctx.fill();
        }

        if (st === 'relax') {
          ctx.fillStyle = '#2F64E8';
          ctx.beginPath();
          ctx.arc(0, 0, baseR + 0.3, Math.PI * 0.65, Math.PI * 1.35);
          ctx.closePath();
          ctx.fill();
        } else if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(130, 230, 255, 0.88)';
          ctx.beginPath();
          ctx.ellipse(-baseR * 0.3, side * baseR * 0.45, baseR * 0.36, baseR * 0.22, 0.25, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'happy') {
      const pulse = 0.8 + Math.sin(this.time * 8) * 0.25;
      ctx.fillStyle = '#FFE45E';
      this._star(ctx, pts[0].x + 5, -W * 0.35, 4 * pulse);
      this._star(ctx, pts[2].x, W * 0.44, 3 * pulse);
    } else if (st === 'shock') {
      ctx.font = 'bold 13px sans-serif';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.strokeText('!', pts[0].x + 7, -W * 0.26);
      ctx.fillStyle = '#FF3358';
      ctx.fillText('!', pts[0].x + 7, -W * 0.26);
    } else if (st === 'fear' || st === 'stress') {
      ctx.fillStyle = '#7CE4FF';
      ctx.strokeStyle = '#1D5486';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(pts[1].x + 1, -W * 0.38);
      ctx.quadraticCurveTo(pts[1].x - 5, -W * 0.46, pts[1].x - 7, -W * 0.38);
      ctx.quadraticCurveTo(pts[1].x - 5, -W * 0.30, pts[1].x + 1, -W * 0.38);
      ctx.fill();
      ctx.stroke();
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
    const L = Bettafish.metadata.baseLength;
    const W = Bettafish.metadata.baseWidth;
    const shX = this._pose.shiver ? Math.sin(this.time * 58) * this._pose.shiver : 0;
    const shY = this._pose.shiver ? Math.cos(this.time * 66) * this._pose.shiver : 0;

    ctx.save();
    ctx.translate(this.x + shX, this.y + this._pose.bobY + shY);
    ctx.rotate(this.angle);
    ctx.scale(this.scale * this._pose.squashX, this.scale * this._pose.squashY);

    const pts = this._buildSpine(L, W);

    // Drop shadow
    ctx.save();
    ctx.translate(-2, 4);
    this._traceBody(ctx, pts, L, W);
    ctx.fillStyle = 'rgba(10, 14, 38, 0.22)';
    ctx.fill();
    ctx.restore();

    // Flowing veil caudal & pectoral fins
    this._drawVeilTail(ctx, pts, L, W);
    this._drawFlowingPectorals(ctx, pts, L, W);

    // Royal-blue to crimson gradient slender chibi body
    this._traceBody(ctx, pts, L, W);
    const bg = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
    bg.addColorStop(0, '#1C4CE0');
    bg.addColorStop(0.38, '#2C6EFF');
    bg.addColorStop(0.72, '#9A249E');
    bg.addColorStop(1, '#E21E5A');
    ctx.fillStyle = bg;
    ctx.fill();

    // Clipped iridescent scales + cel-shading + jelly highlight
    ctx.save();
    this._traceBody(ctx, pts, L, W);
    ctx.clip();

    // Shimmering iridescent cyan-violet scale arcs
    ctx.strokeStyle = 'rgba(130, 232, 255, 0.34)';
    ctx.lineWidth = 0.85;
    for (let i = 2; i < pts.length - 1; i++) {
      for (const s of [-0.45, 0, 0.45]) {
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y + s * pts[i].hw, 3.0, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();
      }
    }

    // Glossy dorsal highlight
    const hl = ctx.createLinearGradient(pts[0].x, -W * 0.2, pts[5].x, W * 0.08);
    hl.addColorStop(0, 'rgba(215, 245, 255, 0.56)');
    hl.addColorStop(0.7, 'rgba(255, 220, 245, 0.16)');
    hl.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.ellipse(pts[2].x, pts[2].y - W * 0.08, L * 0.18, W * 0.08, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Chibi ink outline
    this._traceBody(ctx, pts, L, W);
    ctx.strokeStyle = '#180E32';
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Flowing ribbon dorsal on top
    this._drawRibbonDorsal(ctx, pts, L, W);

    // Expressive eyes & emotes
    this._drawEyesAndEmotes(ctx, pts, L, W);

    ctx.restore();
  }
}

export default Bettafish;
