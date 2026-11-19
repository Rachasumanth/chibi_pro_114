/**
 * Lionfish ("Red Lionfish") — Standalone 2D Top-Down Expressive Chibi ES Module
 * Dimensions: 115x85 | Category: fish | Zero external dependencies (Canvas 2D API)
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
    waveAmp: 0.08, waveFreq: 2.6, turnBend: 0, finSweep: 0.14, finFreq: 2.2, plumeFlare: 1.0,
    squashX: 1, squashY: 1, mouthOpen: 0, shiver: 0, bobY: 0, eyeScale: 1
  };
  switch (state) {
    case 'breathing':
      pose.waveAmp = 0.05; pose.waveFreq = 1.9;
      pose.squashX = 1 + Math.sin(t * 2.2) * 0.02;
      pose.squashY = 1 - Math.sin(t * 2.2) * 0.02;
      break;
    case 'swimming':
      pose.waveAmp = 0.15; pose.waveFreq = 5.4; pose.finSweep = 0.28; pose.finFreq = 5.0; pose.plumeFlare = 0.92;
      break;
    case 'relax':
      pose.waveAmp = 0.03; pose.waveFreq = 1.2; pose.finSweep = 0.06; pose.plumeFlare = 1.05;
      break;
    case 'left_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.10; pose.waveFreq = 4.4; pose.turnBend = -0.52 * env;
      break;
    }
    case 'right_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.10; pose.waveFreq = 4.4; pose.turnBend = 0.52 * env;
      break;
    }
    case 'eating': {
      const ch = Math.max(0, Math.sin(clamp(p, 0, 1) * Math.PI * 3));
      pose.mouthOpen = ch; pose.waveAmp = 0.11; pose.waveFreq = 5.0; pose.plumeFlare = 1.12;
      pose.squashX = 1 + ch * 0.06; pose.squashY = 1 - ch * 0.04;
      break;
    }
    case 'hungry':
      pose.waveAmp = 0.12; pose.waveFreq = 4.5; pose.mouthOpen = Math.max(0, Math.sin(t * 7.5)) * 0.8; pose.eyeScale = 1.12;
      break;
    case 'stress':
      pose.waveAmp = 0.13; pose.waveFreq = 10.8; pose.shiver = 1.3; pose.plumeFlare = 1.18;
      break;
    case 'fear':
      pose.waveAmp = 0.20; pose.waveFreq = 13.0; pose.shiver = 2.0; pose.eyeScale = 1.24; pose.plumeFlare = 1.24;
      break;
    case 'shock': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.02; pose.shiver = 1.8 * env; pose.eyeScale = 1.32; pose.mouthOpen = 0.88 * env; pose.plumeFlare = 1.28;
      pose.squashX = 0.88 + (1 - env) * 0.12; pose.squashY = 1.14 - (1 - env) * 0.14;
      break;
    }
    case 'happy':
      pose.waveAmp = 0.14; pose.waveFreq = 6.8; pose.finSweep = 0.30; pose.bobY = Math.sin(t * 6.5) * 1.4;
      break;
    case 'sad':
      pose.waveAmp = 0.03; pose.waveFreq = 1.4; pose.finSweep = 0.05; pose.plumeFlare = 0.82;
      break;
  }
  return pose;
}

export class Lionfish {
  static metadata = {
    name: 'Red Lionfish',
    category: 'fish',
    baseLength: 115,
    baseWidth: 85
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
    // Compact plump chibi trunk while huge fan plumes take up most of W (85px)
    const count = 8;
    const bodyL = L * 0.72;
    const noseX = L * 0.42;
    const trunkW = W * 0.42;
    const widths = [0.0, 0.34, 0.48, 0.50, 0.42, 0.31, 0.18, 0.10];
    const pts = [];
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const x = noseX - u * bodyL;
      const wave = Math.sin(this.phase - u * 2.8) * this._pose.waveAmp * L * (0.09 + u * u * 0.85);
      const bend = this._pose.turnBend * trunkW * (u * u * 0.9);
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
    ctx.bezierCurveTo(pts[0].x + 2, pts[0].y - W * 0.12, top[0].x + 4, top[0].y - 2, top[0].x, top[0].y);
    for (let i = 0; i < top.length - 1; i++) {
      ctx.quadraticCurveTo(top[i].x, top[i].y, (top[i].x + top[i + 1].x) * 0.5, (top[i].y + top[i + 1].y) * 0.5);
    }
    ctx.lineTo(top[top.length - 1].x, top[top.length - 1].y);
    ctx.lineTo(bot[bot.length - 1].x, bot[bot.length - 1].y);
    for (let i = bot.length - 1; i > 0; i--) {
      ctx.quadraticCurveTo(bot[i].x, bot[i].y, (bot[i].x + bot[i - 1].x) * 0.5, (bot[i].y + bot[i - 1].y) * 0.5);
    }
    ctx.bezierCurveTo(bot[0].x + 4, bot[0].y + 2, pts[0].x + 2, pts[0].y + W * 0.12, pts[0].x, pts[0].y);
    ctx.closePath();
  }

  _drawFanPlumes(ctx, pts, L, W) {
    // Dramatic fan-like banded pectoral plumes with translucent scalloped webbing
    const anchor = pts[2];
    const flare = this._pose.plumeFlare;
    const sweep = Math.sin(this.time * this._pose.finFreq) * this._pose.finSweep;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(anchor.x + 2, anchor.y + side * pts[2].hw * 0.72);
      ctx.rotate(side * (0.12 + sweep * (side > 0 ? 1 : -0.85)));

      const rayCount = 7;
      const tips = [];
      for (let i = 0; i < rayCount; i++) {
        const frac = i / (rayCount - 1);
        // Fan sweeps from forward-outward to backward-outward
        const ang = side * (0.48 + frac * 1.92);
        const len = W * (0.38 + Math.sin(frac * Math.PI) * 0.14) * flare;
        const bend = Math.sin(this.phase - frac * 1.8) * 2.6;
        tips.push({
          x: Math.cos(ang) * len + bend,
          y: Math.sin(ang) * len
        });
      }

      // Translucent scalloped webbing connecting the lower 68% of each plume ray
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(tips[0].x * 0.72, tips[0].y * 0.72);
      for (let i = 0; i < rayCount - 1; i++) {
        const p0 = tips[i], p1 = tips[i + 1];
        const mx = (p0.x + p1.x) * 0.30;
        const my = (p0.y + p1.y) * 0.30;
        ctx.quadraticCurveTo(mx, my, p1.x * 0.72, p1.y * 0.72);
      }
      ctx.lineTo(0, 0);
      ctx.closePath();

      const webGrad = ctx.createRadialGradient(0, 0, 2, 0, side * W * 0.25, W * 0.45);
      webGrad.addColorStop(0, 'rgba(175, 42, 46, 0.78)');
      webGrad.addColorStop(0.55, 'rgba(255, 232, 206, 0.52)');
      webGrad.addColorStop(1, 'rgba(138, 24, 34, 0.35)');
      ctx.fillStyle = webGrad;
      ctx.fill();

      // Individual banded maroon & cream feathery plume rays
      for (let i = 0; i < rayCount; i++) {
        const tip = tips[i];
        const segs = 5;
        for (let s = 0; s < segs; s++) {
          const t0 = s / segs, t1 = (s + 1) / segs;
          ctx.beginPath();
          ctx.moveTo(tip.x * t0, tip.y * t0);
          ctx.lineTo(tip.x * t1, tip.y * t1);
          ctx.strokeStyle = s % 2 === 0 ? '#7D1924' : '#FFF4E4';
          ctx.lineWidth = (1 - t0 * 0.55) * 4.4;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
        // Crisp dark outline along spine
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tip.x, tip.y);
        ctx.strokeStyle = 'rgba(34, 12, 16, 0.45)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawSpottedCaudalFin(ctx, pts, L, W) {
    // Translucent fan tail dotted with maroon spots
    const tail = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const dir = Math.atan2(tail.y - prev.y, tail.x - prev.x);
    const wag = Math.sin(this.phase - 3.3) * 0.24 + this._pose.turnBend * 0.36;

    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(dir + wag);

    const tL = L * 0.26;
    const tH = W * 0.24;
    const grad = ctx.createLinearGradient(0, 0, tL, 0);
    grad.addColorStop(0, 'rgba(255, 240, 224, 0.82)');
    grad.addColorStop(1, 'rgba(255, 248, 240, 0.35)');

    ctx.beginPath();
    ctx.moveTo(0, -tH * 0.22);
    ctx.bezierCurveTo(tL * 0.5, -tH * 0.95, tL * 1.05, -tH * 0.82, tL * 1.02, 0);
    ctx.bezierCurveTo(tL * 1.05, tH * 0.82, tL * 0.5, tH * 0.95, 0, tH * 0.22);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Maroon polka spots on translucent tail
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(126, 22, 34, 0.78)';
    for (let r = -2; r <= 2; r++) {
      for (let c = 1; c <= 3; c++) {
        ctx.beginPath();
        ctx.arc(tL * (0.24 * c + 0.05), r * tH * 0.28 + (c % 2) * 1.4, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    ctx.strokeStyle = '#2B1014';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  _drawVenomousDorsalSpines(ctx, pts, L, W) {
    // 7 banded venomous dorsal spines alternating slightly left/right along dorsal crest
    for (let i = 1; i < 7; i++) {
      const p = pts[i];
      const sway = Math.sin(this.phase - i * 0.7) * 4.5;
      const sideBias = (i % 2 === 0 ? 1 : -1) * 3.5;
      const spLen = 13 + (i === 2 || i === 3 ? 5 : 0);

      ctx.save();
      ctx.translate(p.x, p.y);
      const tx = -spLen * 0.82;
      const ty = sideBias + sway;
      for (let s = 0; s < 3; s++) {
        const a0 = s / 3, a1 = (s + 1) / 3;
        ctx.beginPath();
        ctx.moveTo(tx * a0, ty * a0);
        ctx.lineTo(tx * a1, ty * a1);
        ctx.strokeStyle = s % 2 === 0 ? '#7E1824' : '#FFF3E0';
        ctx.lineWidth = (1 - a0 * 0.55) * 3.2;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawZebraStripes(ctx, pts, L, W) {
    // Alternating maroon-crimson and warm-cream zebra stripes across body
    const colors = ['#7D1622', '#FFF4E2', '#9A222E', '#FFF4E2', '#7D1622', '#FFF4E2', '#8B1B28'];
    for (let i = 0; i < colors.length; i++) {
      const u = (i + 0.5) / colors.length;
      const cx = lerp(pts[0].x - 3, pts[pts.length - 1].x + 2, u);
      const bandW = L * 0.056;
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.moveTo(cx + bandW * 0.55, -W * 0.35);
      ctx.quadraticCurveTo(cx + bandW * 0.85, 0, cx + bandW * 0.55, W * 0.35);
      ctx.lineTo(cx - bandW * 0.55, W * 0.35);
      ctx.quadraticCurveTo(cx - bandW * 0.25, 0, cx - bandW * 0.55, -W * 0.35);
      ctx.closePath();
      ctx.fill();
    }
  }

  _drawEyesAndEmotes(ctx, pts, L, W) {
    const head = pts[1];
    const ex = head.x + 5;
    const sep = pts[1].hw * 0.72;
    const baseR = 5.4 * this._pose.eyeScale;
    const st = this.state;

    // Cute supraorbital tentacles (lionfish brow tufts)
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.strokeStyle = '#7D1622';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex + 2, head.y + side * (sep - 1));
      ctx.quadraticCurveTo(ex + 7, head.y + side * (sep + 5), ex + 10, head.y + side * (sep + 3));
      ctx.stroke();
      ctx.restore();
    }

    // Rosy cheek blushes
    for (const side of [-1, 1]) {
      const bg = ctx.createRadialGradient(ex - 4, head.y + side * (sep + 3), 0.5, ex - 4, head.y + side * (sep + 3), 5);
      bg.addColorStop(0, 'rgba(255, 118, 138, 0.58)');
      bg.addColorStop(1, 'rgba(255, 118, 138, 0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(ex - 4, head.y + side * (sep + 3), 4.5, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this._pose.mouthOpen > 0.05) {
      const m = this._pose.mouthOpen;
      ctx.fillStyle = '#4B1218';
      ctx.beginPath();
      ctx.ellipse(pts[0].x - 1, pts[0].y, 2.2 * m + 1.0, 3.0 * m + 1.0, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ey = head.y + side * sep;
      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#240C10'; ctx.lineWidth = 2.3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, baseR * 0.78, -Math.PI * 0.42, Math.PI * 0.42); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#240C10'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-baseR * 0.55, -baseR * 0.55); ctx.lineTo(baseR * 0.45, 0); ctx.lineTo(-baseR * 0.55, baseR * 0.55); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, baseR, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFDF8'; ctx.fill();
        ctx.strokeStyle = '#240C10'; ctx.lineWidth = 1.6; ctx.stroke();

        const irisR = st === 'shock' ? baseR * 0.36 : baseR * 0.75;
        const ig = ctx.createRadialGradient(0.4, -0.4, 0.5, 0, 0, irisR);
        ig.addColorStop(0, '#1D090E');
        ig.addColorStop(0.55, '#3A1118');
        ig.addColorStop(0.84, '#FF7D3B');
        ig.addColorStop(1, '#FFD16B');
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
          ctx.fillStyle = '#8F1E2A';
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
      this._star(ctx, pts[0].x + 8, -22, 4.5 * pulse);
      this._star(ctx, pts[2].x, 26, 3.5 * pulse);
    } else if (st === 'shock') {
      ctx.font = 'bold 15px sans-serif';
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.2;
      ctx.strokeText('!', pts[0].x + 10, -14);
      ctx.fillStyle = '#FF3344'; ctx.fillText('!', pts[0].x + 10, -14);
    } else if (st === 'fear' || st === 'stress') {
      ctx.fillStyle = '#7CE4FF'; ctx.strokeStyle = '#1D5486'; ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(pts[1].x + 2, -24);
      ctx.quadraticCurveTo(pts[1].x - 5, -28, pts[1].x - 8, -24);
      ctx.quadraticCurveTo(pts[1].x - 5, -20, pts[1].x + 2, -24);
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
    const L = Lionfish.metadata.baseLength;
    const W = Lionfish.metadata.baseWidth;
    const shX = this._pose.shiver ? Math.sin(this.time * 58) * this._pose.shiver : 0;
    const shY = this._pose.shiver ? Math.cos(this.time * 66) * this._pose.shiver : 0;

    ctx.save();
    ctx.translate(this.x + shX, this.y + this._pose.bobY + shY);
    ctx.rotate(this.angle);
    ctx.scale(this.scale * this._pose.squashX, this.scale * this._pose.squashY);

    const pts = this._buildSpine(L, W);

    // Shadow
    ctx.save();
    ctx.translate(-2, 5);
    this._traceBody(ctx, pts, L, W);
    ctx.fillStyle = 'rgba(20, 8, 12, 0.24)';
    ctx.fill();
    ctx.restore();

    // Dramatic fan plumes & spotted tail
    this._drawSpottedCaudalFin(ctx, pts, L, W);
    this._drawFanPlumes(ctx, pts, L, W);

    // Base cream-maroon body
    this._traceBody(ctx, pts, L, W);
    ctx.fillStyle = '#FFF1DC';
    ctx.fill();

    // Clipped zebra stripes + cel-shading + jelly highlight
    ctx.save();
    this._traceBody(ctx, pts, L, W);
    ctx.clip();
    this._drawZebraStripes(ctx, pts, L, W);

    // Cel-shade rim
    ctx.strokeStyle = 'rgba(72, 12, 20, 0.35)';
    ctx.lineWidth = 6.0;
    this._traceBody(ctx, pts, L, W);
    ctx.stroke();

    // Glossy dorsal highlight
    const hl = ctx.createLinearGradient(pts[1].x, -12, pts[5].x, 4);
    hl.addColorStop(0, 'rgba(255, 255, 255, 0.52)');
    hl.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.ellipse(pts[2].x, pts[2].y - 5, L * 0.22, 6, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bold outline
    this._traceBody(ctx, pts, L, W);
    ctx.strokeStyle = '#260D12';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Venomous banded dorsal spines
    this._drawVenomousDorsalSpines(ctx, pts, L, W);

    // Expressive eyes & emotes
    this._drawEyesAndEmotes(ctx, pts, L, W);
    ctx.restore();
  }
}

export default Lionfish;
