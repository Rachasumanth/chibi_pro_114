/**
 * Greatwhitesharkfish ("Great White Shark") — Standalone 2D Top-Down Expressive Chibi ES Module
 * Dimensions: 240x96 | Category: fish | Zero external dependencies (Canvas 2D API)
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
    waveAmp: 0.08, waveFreq: 2.5, turnBend: 0, finSweep: 0.08, finFreq: 2.2, gillFlare: 0.25,
    squashX: 1, squashY: 1, mouthOpen: 0, shiver: 0, bobY: 0, eyeScale: 1
  };
  switch (state) {
    case 'breathing':
      pose.waveAmp = 0.045; pose.waveFreq = 1.7; pose.gillFlare = 0.35 + Math.sin(t * 2.4) * 0.25;
      pose.squashX = 1 + Math.sin(t * 2.0) * 0.015;
      pose.squashY = 1 - Math.sin(t * 2.0) * 0.015;
      break;
    case 'swimming':
      pose.waveAmp = 0.15; pose.waveFreq = 5.0; pose.finSweep = 0.14; pose.gillFlare = 0.55;
      break;
    case 'relax':
      pose.waveAmp = 0.03; pose.waveFreq = 1.1; pose.gillFlare = 0.15;
      break;
    case 'left_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.09; pose.waveFreq = 4.2; pose.turnBend = -0.58 * env;
      break;
    }
    case 'right_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.09; pose.waveFreq = 4.2; pose.turnBend = 0.58 * env;
      break;
    }
    case 'eating': {
      const ch = Math.max(0, Math.sin(clamp(p, 0, 1) * Math.PI * 3));
      pose.mouthOpen = ch; pose.waveAmp = 0.12; pose.waveFreq = 5.4; pose.gillFlare = 0.85;
      pose.squashX = 1 + ch * 0.04; pose.squashY = 1 - ch * 0.03;
      break;
    }
    case 'hungry':
      pose.waveAmp = 0.13; pose.waveFreq = 4.4; pose.mouthOpen = Math.max(0, Math.sin(t * 6.8)) * 0.85; pose.eyeScale = 1.12;
      break;
    case 'stress':
      pose.waveAmp = 0.13; pose.waveFreq = 10.2; pose.shiver = 1.8; pose.gillFlare = 0.95;
      break;
    case 'fear':
      pose.waveAmp = 0.18; pose.waveFreq = 12.2; pose.shiver = 2.6; pose.eyeScale = 1.24; pose.gillFlare = 1.0;
      break;
    case 'shock': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.02; pose.shiver = 2.4 * env; pose.eyeScale = 1.34; pose.mouthOpen = 0.9 * env;
      pose.squashX = 0.90 + (1 - env) * 0.10; pose.squashY = 1.12 - (1 - env) * 0.12;
      break;
    }
    case 'happy':
      pose.waveAmp = 0.14; pose.waveFreq = 6.2; pose.bobY = Math.sin(t * 5.8) * 1.8;
      break;
    case 'sad':
      pose.waveAmp = 0.03; pose.waveFreq = 1.3; pose.gillFlare = 0.15;
      break;
  }
  return pose;
}

export class Greatwhitesharkfish {
  static metadata = {
    name: 'Great White Shark',
    category: 'fish',
    baseLength: 240,
    baseWidth: 96
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
    // Thick muscular conical-snout chibi shark torpedo
    const count = 9;
    const bodyL = L * 0.78;
    const noseX = L * 0.46;
    const trunkW = W * 0.58;
    const widths = [0.0, 0.28, 0.46, 0.50, 0.44, 0.32, 0.20, 0.13, 0.09];
    const pts = [];
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const x = noseX - u * bodyL;
      const wave = Math.sin(this.phase - u * 3.2) * this._pose.waveAmp * L * (0.04 + u * u * 0.92);
      const bend = this._pose.turnBend * trunkW * (u * u * 0.95);
      pts.push({ x, y: wave + bend, hw: widths[i] * trunkW, u });
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
    ctx.bezierCurveTo(pts[0].x - 2, pts[0].y - W * 0.10, top[0].x + 12, top[0].y - 3, top[0].x, top[0].y);
    for (let i = 0; i < top.length - 1; i++) {
      ctx.quadraticCurveTo(top[i].x, top[i].y, (top[i].x + top[i + 1].x) * 0.5, (top[i].y + top[i + 1].y) * 0.5);
    }
    ctx.lineTo(top[top.length - 1].x, top[top.length - 1].y);
    ctx.lineTo(bot[bot.length - 1].x, bot[bot.length - 1].y);
    for (let i = bot.length - 1; i > 0; i--) {
      ctx.quadraticCurveTo(bot[i].x, bot[i].y, (bot[i].x + bot[i - 1].x) * 0.5, (bot[i].y + bot[i - 1].y) * 0.5);
    }
    ctx.bezierCurveTo(bot[0].x + 12, bot[0].y + 3, pts[0].x - 2, pts[0].y + W * 0.10, pts[0].x, pts[0].y);
    ctx.closePath();
  }

  _drawPectoralAndPelvicWings(ctx, pts, L, W) {
    // Broad triangular great-white pectoral wings + smaller rear pelvic fins
    const pAnchor = pts[3];
    const sweep = Math.sin(this.time * this._pose.finFreq) * this._pose.finSweep;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(pAnchor.x + 8, pAnchor.y + side * pts[3].hw * 0.78);
      ctx.rotate(side * sweep * 0.45);

      const g = ctx.createLinearGradient(0, 0, -L * 0.16, side * W * 0.42);
      g.addColorStop(0, '#6B7F94');
      g.addColorStop(0.7, '#4F6175');
      g.addColorStop(1, '#2D3A49');

      ctx.beginPath();
      ctx.moveTo(14, -side * 4);
      ctx.bezierCurveTo(6, side * W * 0.24, -L * 0.08, side * W * 0.44, -L * 0.20, side * W * 0.42);
      ctx.quadraticCurveTo(-L * 0.12, side * W * 0.18, -L * 0.16, -side * 4);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = '#18212C';
      ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }

    // Pelvic fins
    const vAnchor = pts[6];
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(vAnchor.x, vAnchor.y + side * pts[6].hw * 0.8);
      ctx.fillStyle = '#5B6D82';
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-10, side * 16);
      ctx.quadraticCurveTo(-12, side * 5, -10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#18212C';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawCrescentTailAndKeels(ctx, pts, L, W) {
    // Caudal keels flanking tail peduncle + heavy crescent shark tail
    const keelPt = pts[7];
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#4B5D72';
      ctx.strokeStyle = '#18212C';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(keelPt.x, keelPt.y + side * (pts[7].hw + 2.5), 11, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    const tail = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const dir = Math.atan2(tail.y - prev.y, tail.x - prev.x);
    const wag = Math.sin(this.phase - 3.6) * 0.28 + this._pose.turnBend * 0.42;

    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(dir + wag);

    const tL = L * 0.24, tH = W * 0.44;
    const g = ctx.createLinearGradient(0, 0, tL, 0);
    g.addColorStop(0, '#66798F');
    g.addColorStop(0.7, '#4A5C70');
    g.addColorStop(1, '#2D3A4A');

    ctx.beginPath();
    ctx.moveTo(-2, -6);
    ctx.bezierCurveTo(tL * 0.35, -tH * 0.72, tL * 0.80, -tH * 1.05, tL * 1.08, -tH * 0.92);
    ctx.quadraticCurveTo(tL * 0.46, 0, tL * 0.92, tH * 0.80);
    ctx.bezierCurveTo(tL * 0.65, tH * 0.90, tL * 0.30, tH * 0.62, -2, 6);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#18212C';
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawGillsAndNostrils(ctx, pts, L, W) {
    // Pair of conical snout nostrils
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#1B2530';
      ctx.beginPath();
      ctx.ellipse(pts[0].x - 14, pts[0].y + side * 6.5, 2.6, 1.4, side * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5 animated gill slits per side behind head
    const gillBase = pts[2];
    const flare = this._pose.gillFlare;
    ctx.save();
    ctx.strokeStyle = '#243040';
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      for (let g = 0; g < 5; g++) {
        const gx = gillBase.x + 12 - g * 5.2;
        const gy = gillBase.y + side * (pts[2].hw * 0.78);
        ctx.lineWidth = 1.6 + flare * 0.8;
        ctx.beginPath();
        ctx.moveTo(gx, gy - side * 4.5);
        ctx.quadraticCurveTo(gx - 2.2 - flare * 1.5, gy, gx, gy + side * 4.5);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _drawDorsalFins(ctx, pts, L, W) {
    // Iconic swept triangular primary dorsal fin + tiny second dorsal
    const sway = Math.sin(this.phase - 1.5) * 6.5;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[3].x + 14, pts[3].y);
    ctx.bezierCurveTo(pts[4].x + 6, pts[4].y - 10 + sway, pts[5].x - 8, pts[5].y - 12 + sway * 1.2, pts[5].x - 18, pts[5].y + sway);
    ctx.bezierCurveTo(pts[4].x - 4, pts[4].y + 8 + sway * 0.4, pts[3].x + 2, pts[3].y + 7, pts[3].x + 14, pts[3].y);
    ctx.closePath();
    const dg = ctx.createLinearGradient(pts[3].x, pts[3].y - 12, pts[5].x, pts[5].y + 8);
    dg.addColorStop(0, '#5A6D82');
    dg.addColorStop(1, '#2D3A49');
    ctx.fillStyle = dg;
    ctx.fill();
    ctx.strokeStyle = '#18212C';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Small rear dorsal
    ctx.beginPath();
    ctx.ellipse(pts[7].x + 3, pts[7].y + sway * 0.6, 7, 2.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#4A5C70';
    ctx.fill();
    ctx.strokeStyle = '#18212C';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }

  _drawEyesAndEmotes(ctx, pts, L, W) {
    const head = pts[1];
    const ex = head.x + 8;
    const sep = pts[1].hw * 0.72;
    const baseR = 7.4 * this._pose.eyeScale;
    const st = this.state;

    // Rosy chibi cheek blushes
    for (const side of [-1, 1]) {
      const bg = ctx.createRadialGradient(ex - 7, head.y + side * (sep + 4), 0.8, ex - 7, head.y + side * (sep + 4), 7.5);
      bg.addColorStop(0, 'rgba(255, 118, 148, 0.56)');
      bg.addColorStop(1, 'rgba(255, 118, 148, 0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(ex - 7, head.y + side * (sep + 4), 7.0, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cute toothy chomping grin when eating/hungry/shock
    if (this._pose.mouthOpen > 0.05) {
      const m = this._pose.mouthOpen;
      ctx.save();
      ctx.translate(pts[0].x - 5, pts[0].y);
      ctx.fillStyle = '#521522';
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.5 * m + 1.5, 7.2 * m + 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Little white chibi shark teeth
      ctx.fillStyle = '#FFFFFF';
      for (let t = -2; t <= 2; t++) {
        ctx.beginPath();
        ctx.moveTo(3.5 * m, t * 2.4 - 1);
        ctx.lineTo(1.2 * m, t * 2.4);
        ctx.lineTo(3.5 * m, t * 2.4 + 1);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    for (const side of [-1, 1]) {
      const ey = head.y + side * sep;
      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#18212C'; ctx.lineWidth = 3.0; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, baseR * 0.78, -Math.PI * 0.42, Math.PI * 0.42); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#18212C'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-baseR * 0.55, -baseR * 0.55); ctx.lineTo(baseR * 0.45, 0); ctx.lineTo(-baseR * 0.55, baseR * 0.55); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, baseR, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFDF9'; ctx.fill();
        ctx.strokeStyle = '#18212C'; ctx.lineWidth = 2.0; ctx.stroke();

        const irisR = st === 'shock' ? baseR * 0.35 : baseR * 0.76;
        const ig = ctx.createRadialGradient(0.6, -0.6, 0.8, 0, 0, irisR);
        ig.addColorStop(0, '#0D131D');
        ig.addColorStop(0.58, '#182236');
        ig.addColorStop(0.86, '#58A8E8');
        ig.addColorStop(1, '#A4DCFF');
        ctx.beginPath(); ctx.arc(0.5, 0, irisR, 0, Math.PI * 2); ctx.fillStyle = ig; ctx.fill();

        if (st === 'hungry') {
          ctx.fillStyle = '#FFF8B4';
          this._star(ctx, 1.0, -0.4, baseR * 0.55);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(baseR * 0.28, -baseR * 0.30, baseR * 0.30, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(-baseR * 0.24, baseR * 0.26, baseR * 0.14, 0, Math.PI * 2); ctx.fill();
        }
        if (st === 'relax') {
          ctx.fillStyle = '#6B7F94';
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
      this._star(ctx, pts[0].x + 12, -28, 7.0 * pulse);
      this._star(ctx, pts[2].x, 38, 5.5 * pulse);
    } else if (st === 'shock') {
      ctx.font = 'bold 20px sans-serif';
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
      ctx.strokeText('!', pts[0].x + 14, -18);
      ctx.fillStyle = '#FF3344'; ctx.fillText('!', pts[0].x + 14, -18);
    } else if (st === 'fear' || st === 'stress') {
      ctx.fillStyle = '#7CE4FF'; ctx.strokeStyle = '#1D5486'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pts[1].x + 4, -34);
      ctx.quadraticCurveTo(pts[1].x - 8, -40, pts[1].x - 13, -34);
      ctx.quadraticCurveTo(pts[1].x - 8, -28, pts[1].x + 4, -34);
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
    const L = Greatwhitesharkfish.metadata.baseLength;
    const W = Greatwhitesharkfish.metadata.baseWidth;
    const shX = this._pose.shiver ? Math.sin(this.time * 58) * this._pose.shiver : 0;
    const shY = this._pose.shiver ? Math.cos(this.time * 66) * this._pose.shiver : 0;

    ctx.save();
    ctx.translate(this.x + shX, this.y + this._pose.bobY + shY);
    ctx.rotate(this.angle);
    ctx.scale(this.scale * this._pose.squashX, this.scale * this._pose.squashY);

    const pts = this._buildSpine(L, W);

    // Shadow
    ctx.save();
    ctx.translate(-4, 7);
    this._traceBody(ctx, pts, L, W);
    ctx.fillStyle = 'rgba(8, 16, 28, 0.24)';
    ctx.fill();
    ctx.restore();

    this._drawCrescentTailAndKeels(ctx, pts, L, W);
    this._drawPectoralAndPelvicWings(ctx, pts, L, W);

    // Muscular slate-grey shark torso with white countershading rim
    this._traceBody(ctx, pts, L, W);
    const bg = ctx.createLinearGradient(pts[0].x, -W * 0.32, pts[0].x, W * 0.32);
    bg.addColorStop(0, '#96A8BC');
    bg.addColorStop(0.24, '#667A90');
    bg.addColorStop(0.72, '#53657A');
    bg.addColorStop(1, '#39485A');
    ctx.fillStyle = bg;
    ctx.fill();

    // Clipped white belly-edge countershading + glossy dorsal highlight
    ctx.save();
    this._traceBody(ctx, pts, L, W);
    ctx.clip();
    ctx.strokeStyle = 'rgba(235, 244, 252, 0.72)';
    ctx.lineWidth = 7.5;
    this._traceBody(ctx, pts, L, W);
    ctx.stroke();

    const hl = ctx.createLinearGradient(pts[1].x, -W * 0.2, pts[6].x, W * 0.1);
    hl.addColorStop(0, 'rgba(235, 248, 255, 0.48)');
    hl.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.ellipse(pts[3].x + 6, pts[3].y - 9, L * 0.24, 9.5, -0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bold outline
    this._traceBody(ctx, pts, L, W);
    ctx.strokeStyle = '#18212C';
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();

    this._drawGillsAndNostrils(ctx, pts, L, W);
    this._drawDorsalFins(ctx, pts, L, W);
    this._drawEyesAndEmotes(ctx, pts, L, W);
    ctx.restore();
  }
}

export default Greatwhitesharkfish;
