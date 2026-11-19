/**
 * Angelfish ("Freshwater Angelfish") — Standalone 2D Top-Down Expressive Chibi ES Module
 * Dimensions: 90x55 | Category: fish | Zero external dependencies (Canvas 2D API)
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
    waveAmp: 0.08, waveFreq: 2.8, turnBend: 0, finSweep: 0.16, finFreq: 2.6,
    squashX: 1, squashY: 1, mouthOpen: 0, shiver: 0, bobY: 0, eyeScale: 1
  };
  switch (state) {
    case 'breathing':
      pose.waveAmp = 0.05; pose.waveFreq = 2.0;
      pose.squashX = 1 + Math.sin(t * 2.4) * 0.02;
      pose.squashY = 1 - Math.sin(t * 2.4) * 0.02;
      break;
    case 'swimming':
      pose.waveAmp = 0.15; pose.waveFreq = 5.8; pose.finSweep = 0.30; pose.finFreq = 5.4;
      pose.squashX = 1.03; pose.squashY = 0.97;
      break;
    case 'relax':
      pose.waveAmp = 0.03; pose.waveFreq = 1.2; pose.finSweep = 0.07;
      break;
    case 'left_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.10; pose.waveFreq = 4.6; pose.turnBend = -0.52 * env;
      break;
    }
    case 'right_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.10; pose.waveFreq = 4.6; pose.turnBend = 0.52 * env;
      break;
    }
    case 'eating': {
      const ch = Math.max(0, Math.sin(clamp(p, 0, 1) * Math.PI * 3));
      pose.mouthOpen = ch; pose.waveAmp = 0.11; pose.waveFreq = 5.2;
      pose.squashX = 1 + ch * 0.05; pose.squashY = 1 - ch * 0.04;
      break;
    }
    case 'hungry':
      pose.waveAmp = 0.12; pose.waveFreq = 4.8; pose.mouthOpen = Math.max(0, Math.sin(t * 7.8)) * 0.8; pose.eyeScale = 1.12;
      break;
    case 'stress':
      pose.waveAmp = 0.14; pose.waveFreq = 11.2; pose.shiver = 1.3;
      break;
    case 'fear':
      pose.waveAmp = 0.20; pose.waveFreq = 13.5; pose.shiver = 2.0; pose.eyeScale = 1.24;
      break;
    case 'shock': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.02; pose.shiver = 1.8 * env; pose.eyeScale = 1.32; pose.mouthOpen = 0.88 * env;
      pose.squashX = 0.88 + (1 - env) * 0.12; pose.squashY = 1.13 - (1 - env) * 0.13;
      break;
    }
    case 'happy':
      pose.waveAmp = 0.15; pose.waveFreq = 7.2; pose.finSweep = 0.34; pose.bobY = Math.sin(t * 6.5) * 1.4;
      break;
    case 'sad':
      pose.waveAmp = 0.03; pose.waveFreq = 1.4; pose.finSweep = 0.06;
      break;
  }
  return pose;
}

export class Angelfish {
  static metadata = {
    name: 'Freshwater Angelfish',
    category: 'fish',
    baseLength: 90,
    baseWidth: 55
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
    // Tall disc-like diamond chibi angelfish profile
    const count = 8;
    const bodyL = L * 0.66;
    const noseX = L * 0.44;
    const widths = [0.0, 0.24, 0.44, 0.50, 0.46, 0.34, 0.19, 0.09];
    const pts = [];
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const x = noseX - u * bodyL;
      const wave = Math.sin(this.phase - u * 2.6) * this._pose.waveAmp * L * (0.08 + u * u * 0.85);
      const bend = this._pose.turnBend * W * (u * u * 0.72);
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
    ctx.bezierCurveTo(pts[0].x - 2, pts[0].y - W * 0.14, top[0].x + 4, top[0].y - 3, top[0].x, top[0].y);
    for (let i = 0; i < top.length - 1; i++) {
      ctx.quadraticCurveTo(top[i].x, top[i].y, (top[i].x + top[i + 1].x) * 0.5, (top[i].y + top[i + 1].y) * 0.5);
    }
    ctx.lineTo(top[top.length - 1].x, top[top.length - 1].y);
    ctx.lineTo(bot[bot.length - 1].x, bot[bot.length - 1].y);
    for (let i = bot.length - 1; i > 0; i--) {
      ctx.quadraticCurveTo(bot[i].x, bot[i].y, (bot[i].x + bot[i - 1].x) * 0.5, (bot[i].y + bot[i - 1].y) * 0.5);
    }
    ctx.bezierCurveTo(bot[0].x + 4, bot[0].y + 3, pts[0].x - 2, pts[0].y + W * 0.14, pts[0].x, pts[0].y);
    ctx.closePath();
  }

  _drawSweptTrailingFins(ctx, pts, L, W) {
    // Long swept-back trailing wing fins (iconic angelfish silhouette)
    const anchor = pts[3];
    const flutter = Math.sin(this.time * this._pose.finFreq) * this._pose.finSweep;

    for (const side of [-1, 1]) {
      const sway = Math.sin(this.phase - 2.4) * W * 0.14;
      ctx.save();
      ctx.translate(anchor.x, anchor.y + side * W * 0.42);
      ctx.rotate(side * flutter * 0.35);

      const finGrad = ctx.createLinearGradient(0, 0, -L * 0.46, side * W * 0.46);
      finGrad.addColorStop(0, 'rgba(220, 232, 245, 0.92)');
      finGrad.addColorStop(0.45, 'rgba(182, 200, 222, 0.82)');
      finGrad.addColorStop(0.85, 'rgba(34, 40, 52, 0.72)');
      finGrad.addColorStop(1, 'rgba(218, 236, 255, 0.45)');

      ctx.beginPath();
      ctx.moveTo(L * 0.08, -side * W * 0.06);
      ctx.bezierCurveTo(
        -L * 0.06, side * W * 0.32,
        -L * 0.28, side * W * 0.54 + sway * 0.5,
        -L * 0.48, side * W * 0.46 + sway
      );
      ctx.bezierCurveTo(
        -L * 0.32, side * W * 0.24 + sway * 0.4,
        -L * 0.20, side * W * 0.06,
        -L * 0.18, -side * W * 0.08
      );
      ctx.closePath();
      ctx.fillStyle = finGrad;
      ctx.fill();

      // Fin rays
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 0.85;
      for (let i = 0; i < 5; i++) {
        const k = i / 4;
        ctx.beginPath();
        ctx.moveTo(L * (0.04 - k * 0.18), 0);
        ctx.quadraticCurveTo(-L * 0.20, side * W * (0.16 + k * 0.22), -L * (0.30 + (1 - k) * 0.16), side * W * (0.20 + (1 - k) * 0.25) + sway);
        ctx.stroke();
      }
      ctx.restore();

      ctx.strokeStyle = '#181E2B';
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawCaudalLyreTail(ctx, pts, L, W) {
    // Delicate trailing lyre-tipped translucent silver tail
    const tail = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const dir = Math.atan2(tail.y - prev.y, tail.x - prev.x);
    const wag = Math.sin(this.phase - 3.3) * 0.25 + this._pose.turnBend * 0.36;

    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(dir + wag);

    const tL = L * 0.34;
    const tH = W * 0.38;

    const grad = ctx.createLinearGradient(0, 0, tL, 0);
    grad.addColorStop(0, 'rgba(220, 232, 246, 0.90)');
    grad.addColorStop(0.55, 'rgba(182, 204, 228, 0.72)');
    grad.addColorStop(1, 'rgba(235, 246, 255, 0.38)');

    ctx.beginPath();
    ctx.moveTo(0, -W * 0.07);
    ctx.bezierCurveTo(tL * 0.35, -tH * 0.62, tL * 0.85, -tH * 0.95, tL * 1.12, -tH * 0.78);
    ctx.quadraticCurveTo(tL * 0.74, -tH * 0.18, tL * 0.78, 0);
    ctx.quadraticCurveTo(tL * 0.74, tH * 0.18, tL * 1.12, tH * 0.78);
    ctx.bezierCurveTo(tL * 0.85, tH * 0.95, tL * 0.35, tH * 0.62, 0, W * 0.07);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 0.8;
    for (let r = -3; r <= 3; r++) {
      ctx.beginPath();
      ctx.moveTo(1, r * 0.8);
      ctx.lineTo(tL * (0.76 + Math.abs(r) * 0.08), r * tH * 0.23);
      ctx.stroke();
    }

    ctx.strokeStyle = '#181E2B';
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawStripesAndScales(ctx, pts, L, W) {
    // Metallic silver shimmering scale lattice
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.lineWidth = 0.85;
    for (let i = 2; i < pts.length - 1; i++) {
      for (let s = -2; s <= 2; s++) {
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y + s * (pts[i].hw * 0.36), 3.6, -Math.PI * 0.42, Math.PI * 0.42);
        ctx.stroke();
      }
    }

    // 4 bold vertical black angelfish stripes
    const stripeSpecs = [
      { idx: 1, xOff: 2, thick: L * 0.044, alpha: 0.92 },
      { idx: 3, xOff: 1, thick: L * 0.068, alpha: 0.95 },
      { idx: 5, xOff: 0, thick: L * 0.060, alpha: 0.92 },
      { idx: 7, xOff: 2, thick: L * 0.040, alpha: 0.88 }
    ];
    for (const sp of stripeSpecs) {
      const p = pts[sp.idx];
      const cx = p.x + sp.xOff;
      const g = ctx.createLinearGradient(cx - sp.thick, p.y, cx + sp.thick, p.y);
      g.addColorStop(0, `rgba(18, 22, 32, ${sp.alpha * 0.72})`);
      g.addColorStop(0.5, `rgba(14, 17, 26, ${sp.alpha})`);
      g.addColorStop(1, `rgba(18, 22, 32, ${sp.alpha * 0.72})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx + sp.thick * 0.5, p.y - W * 0.65);
      ctx.quadraticCurveTo(cx + sp.thick * 0.85, p.y, cx + sp.thick * 0.5, p.y + W * 0.65);
      ctx.lineTo(cx - sp.thick * 0.5, p.y + W * 0.65);
      ctx.quadraticCurveTo(cx - sp.thick * 0.15, p.y, cx - sp.thick * 0.5, p.y - W * 0.65);
      ctx.closePath();
      ctx.fill();
    }
  }

  _drawEyesAndEmotes(ctx, pts, L, W) {
    const head = pts[1];
    const ex = head.x + L * 0.03;
    const sep = W * 0.23;
    const baseR = W * 0.125 * this._pose.eyeScale;
    const st = this.state;

    // Rosy cheek blushes
    for (const side of [-1, 1]) {
      const bg = ctx.createRadialGradient(ex - 4, head.y + side * (sep + 4), 0.5, ex - 4, head.y + side * (sep + 4), 5.5);
      bg.addColorStop(0, 'rgba(255, 118, 152, 0.58)');
      bg.addColorStop(1, 'rgba(255, 118, 152, 0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(ex - 4, head.y + side * (sep + 4), 5.2, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this._pose.mouthOpen > 0.05) {
      const m = this._pose.mouthOpen;
      ctx.fillStyle = '#4A1826';
      ctx.beginPath();
      ctx.ellipse(pts[0].x - 1, pts[0].y, 2.0 * m + 1.0, 2.5 * m + 1.0, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ey = head.y + side * sep;
      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#181E2B';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, baseR * 0.78, -Math.PI * 0.42, Math.PI * 0.42);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#181E2B';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-baseR * 0.55, -baseR * 0.55);
        ctx.lineTo(baseR * 0.45, 0);
        ctx.lineTo(-baseR * 0.55, baseR * 0.55);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, baseR, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFDF9';
        ctx.fill();
        ctx.strokeStyle = '#181E2B';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Ruby-red & charcoal angelfish iris
        const irisR = st === 'shock' ? baseR * 0.36 : baseR * 0.76;
        const ig = ctx.createRadialGradient(0.4, -0.4, 0.5, 0, 0, irisR);
        ig.addColorStop(0, '#14151C');
        ig.addColorStop(0.55, '#1D1822');
        ig.addColorStop(0.84, '#E02E4A');
        ig.addColorStop(1, '#FF6D82');
        ctx.beginPath();
        ctx.arc(0.4, 0, irisR, 0, Math.PI * 2);
        ctx.fillStyle = ig;
        ctx.fill();

        if (st === 'hungry') {
          ctx.fillStyle = '#FFF7AE';
          this._star(ctx, 0.7, -0.3, baseR * 0.56);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(baseR * 0.28, -baseR * 0.30, baseR * 0.30, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(-baseR * 0.24, baseR * 0.26, baseR * 0.14, 0, Math.PI * 2);
          ctx.fill();
        }

        if (st === 'relax') {
          ctx.fillStyle = '#C9D6E6';
          ctx.beginPath();
          ctx.arc(0, 0, baseR + 0.3, Math.PI * 0.65, Math.PI * 1.35);
          ctx.closePath();
          ctx.fill();
        } else if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(130, 228, 255, 0.88)';
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
      this._star(ctx, pts[0].x + 6, -W * 0.34, 4.5 * pulse);
      this._star(ctx, pts[2].x, W * 0.54, 3.5 * pulse);
    } else if (st === 'shock') {
      ctx.font = 'bold 14px sans-serif';
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
      ctx.strokeText('!', pts[0].x + 8, -W * 0.26);
      ctx.fillStyle = '#FF3344';
      ctx.fillText('!', pts[0].x + 8, -W * 0.26);
    } else if (st === 'fear' || st === 'stress') {
      ctx.fillStyle = '#7CE4FF'; ctx.strokeStyle = '#1D5486'; ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(pts[1].x + 2, -W * 0.44);
      ctx.quadraticCurveTo(pts[1].x - 5, -W * 0.52, pts[1].x - 8, -W * 0.44);
      ctx.quadraticCurveTo(pts[1].x - 5, -W * 0.36, pts[1].x + 2, -W * 0.44);
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
    const L = Angelfish.metadata.baseLength;
    const W = Angelfish.metadata.baseWidth;
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
    ctx.fillStyle = 'rgba(12, 22, 40, 0.22)';
    ctx.fill();
    ctx.restore();

    // Swept trailing fins & lyre tail
    this._drawCaudalLyreTail(ctx, pts, L, W);
    this._drawSweptTrailingFins(ctx, pts, L, W);

    // Metallic silver disc body with golden-pearl dorsal sheen
    this._traceBody(ctx, pts, L, W);
    const bodyGrad = ctx.createLinearGradient(pts[0].x, -W * 0.55, pts[0].x, W * 0.55);
    bodyGrad.addColorStop(0, '#F5F9FF');
    bodyGrad.addColorStop(0.28, '#DCE6F2');
    bodyGrad.addColorStop(0.68, '#B8C8DC');
    bodyGrad.addColorStop(1, '#8A9EB8');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Clipped silver scales + 4 vertical black bars + jelly highlight
    ctx.save();
    this._traceBody(ctx, pts, L, W);
    ctx.clip();
    this._drawStripesAndScales(ctx, pts, L, W);

    // Subtle warm pearl crown tint near forehead
    const crown = ctx.createRadialGradient(pts[2].x, pts[2].y, 2, pts[2].x, pts[2].y, W * 0.42);
    crown.addColorStop(0, 'rgba(255, 236, 178, 0.34)');
    crown.addColorStop(1, 'rgba(255, 236, 178, 0)');
    ctx.fillStyle = crown;
    ctx.fillRect(-L, -W, L * 2, W * 2);

    // Glossy jelly highlight
    const hl = ctx.createLinearGradient(pts[1].x, -W * 0.35, pts[5].x, W * 0.1);
    hl.addColorStop(0, 'rgba(255, 255, 255, 0.62)');
    hl.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.ellipse(pts[3].x + 3, pts[3].y - W * 0.16, L * 0.20, W * 0.13, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bold chibi outline
    this._traceBody(ctx, pts, L, W);
    ctx.strokeStyle = '#181E2B';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dorsal fin crest along top midline
    const sway = Math.sin(this.phase - 1.3) * W * 0.08;
    ctx.beginPath();
    ctx.moveTo(pts[2].x, pts[2].y);
    ctx.quadraticCurveTo(pts[4].x, pts[4].y - W * 0.10 + sway, pts[6].x - 4, pts[6].y + sway * 1.2);
    ctx.quadraticCurveTo(pts[4].x, pts[4].y + W * 0.08 + sway * 0.5, pts[2].x, pts[2].y);
    ctx.fillStyle = '#2B3444';
    ctx.fill();
    ctx.strokeStyle = '#181E2B';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    this._drawEyesAndEmotes(ctx, pts, L, W);
    ctx.restore();
  }
}

export default Angelfish;
