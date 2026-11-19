/**
 * Hammerheadsharkfish ("Great Hammerhead Shark") — Standalone 2D Top-Down Expressive Chibi ES Module
 * Dimensions: 210x92 | Category: fish | Zero external dependencies (Canvas 2D API)
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
    waveAmp: 0.09, waveFreq: 2.7, turnBend: 0, finSweep: 0.09, finFreq: 2.4,
    squashX: 1, squashY: 1, mouthOpen: 0, shiver: 0, bobY: 0, eyeScale: 1
  };
  switch (state) {
    case 'breathing':
      pose.waveAmp = 0.05; pose.waveFreq = 1.8;
      pose.squashX = 1 + Math.sin(t * 2.1) * 0.015;
      pose.squashY = 1 - Math.sin(t * 2.1) * 0.015;
      break;
    case 'swimming':
      pose.waveAmp = 0.16; pose.waveFreq = 5.4; pose.finSweep = 0.15;
      break;
    case 'relax':
      pose.waveAmp = 0.03; pose.waveFreq = 1.2;
      break;
    case 'left_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.10; pose.waveFreq = 4.4; pose.turnBend = -0.60 * env;
      break;
    }
    case 'right_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.10; pose.waveFreq = 4.4; pose.turnBend = 0.60 * env;
      break;
    }
    case 'eating': {
      const ch = Math.max(0, Math.sin(clamp(p, 0, 1) * Math.PI * 3));
      pose.mouthOpen = ch; pose.waveAmp = 0.12; pose.waveFreq = 5.2;
      pose.squashX = 1 + ch * 0.04; pose.squashY = 1 - ch * 0.03;
      break;
    }
    case 'hungry':
      pose.waveAmp = 0.13; pose.waveFreq = 4.6; pose.mouthOpen = Math.max(0, Math.sin(t * 7.2)) * 0.85; pose.eyeScale = 1.12;
      break;
    case 'stress':
      pose.waveAmp = 0.14; pose.waveFreq = 10.6; pose.shiver = 1.7;
      break;
    case 'fear':
      pose.waveAmp = 0.19; pose.waveFreq = 12.6; pose.shiver = 2.5; pose.eyeScale = 1.24;
      break;
    case 'shock': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.02; pose.shiver = 2.2 * env; pose.eyeScale = 1.34; pose.mouthOpen = 0.9 * env;
      pose.squashX = 0.90 + (1 - env) * 0.10; pose.squashY = 1.12 - (1 - env) * 0.12;
      break;
    }
    case 'happy':
      pose.waveAmp = 0.15; pose.waveFreq = 6.4; pose.bobY = Math.sin(t * 6.0) * 1.8;
      break;
    case 'sad':
      pose.waveAmp = 0.035; pose.waveFreq = 1.3;
      break;
  }
  return pose;
}

export class Hammerheadsharkfish {
  static metadata = {
    name: 'Great Hammerhead Shark',
    category: 'fish',
    baseLength: 210,
    baseWidth: 92
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
    // Sleek grey shark trunk behind sculpted T-shaped cephalofoil
    const count = 9;
    const bodyL = L * 0.74;
    const neckX = L * 0.36;
    const trunkW = W * 0.44;
    const widths = [0.24, 0.36, 0.44, 0.42, 0.34, 0.25, 0.17, 0.12, 0.08];
    const pts = [];
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const x = neckX - u * bodyL;
      const wave = Math.sin(this.phase - u * 3.3) * this._pose.waveAmp * L * (0.05 + u * u * 0.90);
      const bend = this._pose.turnBend * trunkW * (u * u * 0.95);
      pts.push({ x, y: wave + bend, hw: widths[i] * trunkW, u });
    }
    return pts;
  }

  _traceTrunk(ctx, pts) {
    const n = pts.length;
    const top = [], bot = [];
    for (let i = 0; i < n; i++) {
      const pr = pts[Math.max(0, i - 1)], cr = pts[i], nx = pts[Math.min(n - 1, i + 1)];
      const dx = nx.x - pr.x, dy = nx.y - pr.y;
      const d = Math.hypot(dx, dy) || 1;
      const ux = -dy / d, uy = dx / d;
      top.push({ x: cr.x + ux * cr.hw, y: cr.y + uy * cr.hw });
      bot.push({ x: cr.x - ux * cr.hw, y: cr.y - uy * cr.hw });
    }
    ctx.beginPath();
    ctx.moveTo(top[0].x, top[0].y);
    for (let i = 0; i < top.length - 1; i++) {
      ctx.quadraticCurveTo(top[i].x, top[i].y, (top[i].x + top[i + 1].x) * 0.5, (top[i].y + top[i + 1].y) * 0.5);
    }
    ctx.lineTo(top[top.length - 1].x, top[top.length - 1].y);
    ctx.lineTo(bot[bot.length - 1].x, bot[bot.length - 1].y);
    for (let i = bot.length - 1; i > 0; i--) {
      ctx.quadraticCurveTo(bot[i].x, bot[i].y, (bot[i].x + bot[i - 1].x) * 0.5, (bot[i].y + bot[i - 1].y) * 0.5);
    }
    ctx.lineTo(bot[0].x, bot[0].y);
    ctx.closePath();
  }

  _drawPectorals(ctx, pts, L, W) {
    const pAnchor = pts[2];
    const sweep = Math.sin(this.time * this._pose.finFreq) * this._pose.finSweep;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(pAnchor.x + 4, pAnchor.y + side * pts[2].hw * 0.80);
      ctx.rotate(side * sweep * 0.45);
      const g = ctx.createLinearGradient(0, 0, -L * 0.14, side * W * 0.36);
      g.addColorStop(0, '#788B9D');
      g.addColorStop(1, '#435264');
      ctx.beginPath();
      ctx.moveTo(10, -side * 3);
      ctx.bezierCurveTo(2, side * W * 0.20, -L * 0.08, side * W * 0.38, -L * 0.17, side * W * 0.36);
      ctx.quadraticCurveTo(-L * 0.10, side * W * 0.14, -L * 0.14, -side * 3);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = '#1A232E';
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawCrescentTail(ctx, pts, L, W) {
    const tail = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const dir = Math.atan2(tail.y - prev.y, tail.x - prev.x);
    const wag = Math.sin(this.phase - 3.6) * 0.28 + this._pose.turnBend * 0.42;

    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(dir + wag);

    const tL = L * 0.26, tH = W * 0.40;
    const g = ctx.createLinearGradient(0, 0, tL, 0);
    g.addColorStop(0, '#75889A');
    g.addColorStop(1, '#3B4A5B');

    ctx.beginPath();
    ctx.moveTo(-2, -5);
    ctx.bezierCurveTo(tL * 0.35, -tH * 0.72, tL * 0.88, -tH * 1.12, tL * 1.18, -tH * 0.94);
    ctx.quadraticCurveTo(tL * 0.45, 0, tL * 0.78, tH * 0.68);
    ctx.bezierCurveTo(tL * 0.55, tH * 0.78, tL * 0.25, tH * 0.50, -2, 5);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#1A232E';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
  }

  _drawCephalofoilAndEyes(ctx, pts, L, W) {
    // Wide sculpted T-shaped cephalofoil hammer head with expressive chibi eyes mounted on outer tips!
    const neck = pts[0];
    const headYaw = Math.sin(this.phase + 0.4) * 0.08 - this._pose.turnBend * 0.22;
    const st = this.state;

    ctx.save();
    ctx.translate(neck.x + 8, neck.y);
    ctx.rotate(headYaw);

    const halfSpan = W * 0.46;
    const headGrad = ctx.createLinearGradient(16, -halfSpan, -8, halfSpan);
    headGrad.addColorStop(0, '#9EB0C2');
    headGrad.addColorStop(0.5, '#6F8296');
    headGrad.addColorStop(1, '#4C5E72');

    // Sculpted scalloped cephalofoil hammer silhouette with subtle center notch
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.bezierCurveTo(17, -halfSpan * 0.36, 15, -halfSpan * 0.85, 6, -halfSpan);
    ctx.bezierCurveTo(-4, -halfSpan * 1.04, -12, -halfSpan * 0.94, -10, -halfSpan * 0.72);
    ctx.quadraticCurveTo(-7, -halfSpan * 0.36, -12, -pts[0].hw);
    ctx.lineTo(-12, pts[0].hw);
    ctx.quadraticCurveTo(-7, halfSpan * 0.36, -10, halfSpan * 0.72);
    ctx.bezierCurveTo(-12, halfSpan * 0.94, -4, halfSpan * 1.04, 6, halfSpan);
    ctx.bezierCurveTo(15, halfSpan * 0.85, 17, halfSpan * 0.36, 14, 0);
    ctx.closePath();
    ctx.fillStyle = headGrad;
    ctx.fill();

    // Glossy cephalofoil highlight
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(235, 248, 255, 0.42)';
    ctx.beginPath();
    ctx.ellipse(5, -halfSpan * 0.35, 5.5, halfSpan * 0.42, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#1A232E';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Nostrils along front leading edge
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#1A232E';
      ctx.beginPath();
      ctx.ellipse(12, side * halfSpan * 0.46, 2.2, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rosy blushes just inboard of hammer tips
    for (const side of [-1, 1]) {
      const bg = ctx.createRadialGradient(-2, side * (halfSpan * 0.72), 0.8, -2, side * (halfSpan * 0.72), 6.5);
      bg.addColorStop(0, 'rgba(255, 118, 152, 0.62)');
      bg.addColorStop(1, 'rgba(255, 118, 152, 0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(-2, side * (halfSpan * 0.72), 5.5, 4.0, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chibi eyes mounted right on the outer hammerhead tips!
    const baseR = 7.2 * this._pose.eyeScale;
    for (const side of [-1, 1]) {
      const ex = 2;
      const ey = side * (halfSpan - 3.5);
      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#1A232E'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, baseR * 0.76, -Math.PI * 0.42, Math.PI * 0.42); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#1A232E'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-baseR * 0.55, -baseR * 0.55); ctx.lineTo(baseR * 0.45, 0); ctx.lineTo(-baseR * 0.55, baseR * 0.55); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, baseR, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFDF9'; ctx.fill();
        ctx.strokeStyle = '#1A232E'; ctx.lineWidth = 2.0; ctx.stroke();

        const irisR = st === 'shock' ? baseR * 0.35 : baseR * 0.76;
        const ig = ctx.createRadialGradient(0.5, -0.5, 0.7, 0, 0, irisR);
        ig.addColorStop(0, '#0E1520');
        ig.addColorStop(0.58, '#1B283C');
        ig.addColorStop(0.86, '#FFD24C');
        ig.addColorStop(1, '#FFF1A6');
        ctx.beginPath(); ctx.arc(0.5, 0, irisR, 0, Math.PI * 2); ctx.fillStyle = ig; ctx.fill();

        if (st === 'hungry') {
          ctx.fillStyle = '#FFF8B4';
          this._star(ctx, 0.9, -0.3, baseR * 0.55);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(baseR * 0.28, -baseR * 0.30, baseR * 0.30, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(-baseR * 0.24, baseR * 0.26, baseR * 0.14, 0, Math.PI * 2); ctx.fill();
        }
        if (st === 'relax') {
          ctx.fillStyle = '#6F8296';
          ctx.beginPath(); ctx.arc(0, 0, baseR + 0.4, Math.PI * 0.65, Math.PI * 1.35); ctx.closePath(); ctx.fill();
        } else if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(130, 232, 255, 0.88)';
          ctx.beginPath(); ctx.ellipse(-baseR * 0.3, side * baseR * 0.45, baseR * 0.38, baseR * 0.24, 0.25, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'happy') {
      const pulse = 0.8 + Math.sin(this.time * 8) * 0.25;
      ctx.fillStyle = '#FFE45E';
      this._star(ctx, 20, -halfSpan * 0.8, 6.5 * pulse);
      this._star(ctx, 18, halfSpan * 0.8, 5.0 * pulse);
    } else if (st === 'shock') {
      ctx.font = 'bold 20px sans-serif';
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
      ctx.strokeText('!', 22, -10);
      ctx.fillStyle = '#FF3344'; ctx.fillText('!', 22, -10);
    } else if (st === 'fear' || st === 'stress') {
      ctx.fillStyle = '#7CE4FF'; ctx.strokeStyle = '#1D5486'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(4, -halfSpan - 12);
      ctx.quadraticCurveTo(-8, -halfSpan - 18, -12, -halfSpan - 12);
      ctx.quadraticCurveTo(-8, -halfSpan - 6, 4, -halfSpan - 12);
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
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
    const L = Hammerheadsharkfish.metadata.baseLength;
    const W = Hammerheadsharkfish.metadata.baseWidth;
    const shX = this._pose.shiver ? Math.sin(this.time * 58) * this._pose.shiver : 0;
    const shY = this._pose.shiver ? Math.cos(this.time * 66) * this._pose.shiver : 0;

    ctx.save();
    ctx.translate(this.x + shX, this.y + this._pose.bobY + shY);
    ctx.rotate(this.angle);
    ctx.scale(this.scale * this._pose.squashX, this.scale * this._pose.squashY);

    const pts = this._buildSpine(L, W);

    // Shadow
    ctx.save();
    ctx.translate(-4, 6);
    this._traceTrunk(ctx, pts);
    ctx.fillStyle = 'rgba(8, 16, 28, 0.22)';
    ctx.fill();
    ctx.restore();

    this._drawCrescentTail(ctx, pts, L, W);
    this._drawPectorals(ctx, pts, L, W);

    // Sleek grey shark trunk
    this._traceTrunk(ctx, pts);
    const bg = ctx.createLinearGradient(pts[0].x, -W * 0.24, pts[0].x, W * 0.24);
    bg.addColorStop(0, '#9AB0C4');
    bg.addColorStop(0.35, '#6C8094');
    bg.addColorStop(1, '#405062');
    ctx.fillStyle = bg;
    ctx.fill();

    // Glossy dorsal highlight
    ctx.save();
    this._traceTrunk(ctx, pts);
    ctx.clip();
    const hl = ctx.createLinearGradient(pts[1].x, -12, pts[6].x, 6);
    hl.addColorStop(0, 'rgba(235, 248, 255, 0.45)');
    hl.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.ellipse(pts[3].x, pts[3].y - 6, L * 0.22, 6.5, -0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this._traceTrunk(ctx, pts);
    ctx.strokeStyle = '#1A232E';
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 5 gill slits behind hammer neck
    ctx.strokeStyle = '#243040';
    ctx.lineWidth = 1.6;
    for (const side of [-1, 1]) {
      for (let g = 0; g < 5; g++) {
        const gx = pts[1].x + 6 - g * 4.5;
        const gy = pts[1].y + side * (pts[1].hw * 0.78);
        ctx.beginPath();
        ctx.moveTo(gx, gy - side * 3.5);
        ctx.lineTo(gx - 2, gy + side * 3.5);
        ctx.stroke();
      }
    }

    // Tall swept sickle dorsal fin
    const sway = Math.sin(this.phase - 1.4) * 7.5;
    ctx.beginPath();
    ctx.moveTo(pts[2].x + 8, pts[2].y);
    ctx.bezierCurveTo(pts[3].x, pts[3].y - 12 + sway, pts[5].x - 8, pts[5].y - 16 + sway * 1.2, pts[5].x - 20, pts[5].y + sway);
    ctx.bezierCurveTo(pts[4].x - 2, pts[4].y + 8 + sway * 0.4, pts[3].x, pts[3].y + 6, pts[2].x + 8, pts[2].y);
    ctx.closePath();
    ctx.fillStyle = '#4B5D72';
    ctx.fill();
    ctx.strokeStyle = '#1A232E';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Sculpted cephalofoil hammer head & outer-tip eyes
    this._drawCephalofoilAndEyes(ctx, pts, L, W);
    ctx.restore();
  }
}

export default Hammerheadsharkfish;
