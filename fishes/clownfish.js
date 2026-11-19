/**
 * Clownfish ("Clownfish") — Standalone 2D Top-Down Expressive Chibi ES Module
 * Dimensions: 65x34 | Category: fish | Zero external dependencies (Canvas 2D API)
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);

const STATE_ALIASES = { idle: 'breathing', hunger: 'hungry' };

const ONE_SHOT_DURATIONS = {
  left_turn: 0.65,
  right_turn: 0.65,
  eating: 0.55,
  shock: 0.8
};

const BLEND_DURATION = 0.15;

function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function normalizeState(name) {
  if (typeof name !== 'string') return null;
  const k = name.trim().toLowerCase();
  const mapped = STATE_ALIASES[k] || k;
  return VALID_STATES.has(mapped) ? mapped : null;
}

function canTransition(fromState, toState) {
  if (!toState) return false;
  if (fromState === 'shock') {
    return toState === 'fear' || toState === 'stress';
  }
  if (fromState === 'fear') {
    if (
      toState === 'left_turn' || toState === 'right_turn' ||
      toState === 'relax' || toState === 'happy' ||
      toState === 'eating' || toState === 'hungry' || toState === 'sad'
    ) {
      return false;
    }
  }
  return true;
}

function samplePose(state, t, p) {
  const pose = {
    waveAmp: 0.10,
    waveFreq: 3.6,
    turnBend: 0,
    finSweep: 0.18,
    finFreq: 3.4,
    squashX: 1,
    squashY: 1,
    mouthOpen: 0,
    shiver: 0,
    bobY: 0,
    eyeScale: 1
  };
  switch (state) {
    case 'breathing':
      pose.waveAmp = 0.06;
      pose.waveFreq = 2.4;
      pose.finSweep = 0.14;
      pose.finFreq = 2.6;
      pose.squashX = 1 + Math.sin(t * 2.8) * 0.025;
      pose.squashY = 1 - Math.sin(t * 2.8) * 0.025;
      break;
    case 'swimming':
      pose.waveAmp = 0.20;
      pose.waveFreq = 7.2;
      pose.finSweep = 0.34;
      pose.finFreq = 7.0;
      pose.squashX = 1.03;
      pose.squashY = 0.97;
      break;
    case 'relax':
      pose.waveAmp = 0.04;
      pose.waveFreq = 1.5;
      pose.finSweep = 0.08;
      pose.finFreq = 1.6;
      pose.squashX = 1.02;
      pose.squashY = 1.02;
      break;
    case 'left_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.12;
      pose.waveFreq = 5.5;
      pose.turnBend = -0.58 * env;
      pose.finSweep = 0.36;
      break;
    }
    case 'right_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.12;
      pose.waveFreq = 5.5;
      pose.turnBend = 0.58 * env;
      pose.finSweep = 0.36;
      break;
    }
    case 'eating': {
      const chomp = Math.sin(clamp(p, 0, 1) * Math.PI * 3);
      pose.waveAmp = 0.14;
      pose.waveFreq = 6.2;
      pose.mouthOpen = Math.max(0, chomp);
      pose.squashX = 1 + Math.max(0, chomp) * 0.07;
      pose.squashY = 1 - Math.max(0, chomp) * 0.05;
      break;
    }
    case 'hungry':
      pose.waveAmp = 0.15;
      pose.waveFreq = 5.6;
      pose.mouthOpen = Math.max(0, Math.sin(t * 8.5)) * 0.85;
      pose.eyeScale = 1.12;
      break;
    case 'stress':
      pose.waveAmp = 0.16;
      pose.waveFreq = 12.0;
      pose.shiver = 1.25;
      pose.finFreq = 10.5;
      pose.squashX = 0.96;
      pose.squashY = 1.05;
      break;
    case 'fear':
      pose.waveAmp = 0.24;
      pose.waveFreq = 14.5;
      pose.shiver = 2.0;
      pose.finSweep = 0.42;
      pose.finFreq = 12.0;
      pose.eyeScale = 1.22;
      pose.squashX = 0.93;
      pose.squashY = 1.08;
      break;
    case 'shock': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.03;
      pose.shiver = 1.8 * env;
      pose.squashX = 0.86 + (1 - env) * 0.14;
      pose.squashY = 1.16 - (1 - env) * 0.16;
      pose.eyeScale = 1.32;
      pose.mouthOpen = 0.9 * env;
      break;
    }
    case 'happy':
      pose.waveAmp = 0.18;
      pose.waveFreq = 8.4;
      pose.finSweep = 0.36;
      pose.finFreq = 8.4;
      pose.bobY = Math.sin(t * 7.5) * 1.4;
      pose.squashX = 1 + Math.sin(t * 7.5) * 0.04;
      pose.squashY = 1 - Math.sin(t * 7.5) * 0.04;
      break;
    case 'sad':
      pose.waveAmp = 0.04;
      pose.waveFreq = 1.7;
      pose.finSweep = 0.07;
      pose.finFreq = 1.8;
      pose.squashX = 0.97;
      pose.squashY = 1.03;
      break;
  }
  return pose;
}

export class Clownfish {
  static metadata = {
    name: 'Clownfish',
    category: 'fish',
    baseLength: 65,
    baseWidth: 34
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

  getState() {
    return this.state;
  }

  setAngle(radians) {
    if (typeof radians === 'number' && Number.isFinite(radians)) {
      this.angle = radians;
    }
  }

  setDirection(dx, dy) {
    if (typeof dx === 'number' && typeof dy === 'number' && (dx !== 0 || dy !== 0)) {
      this.angle = Math.atan2(dy, dx);
    }
  }

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

    if (!ONE_SHOT_DURATIONS[this.state]) {
      this.previousState = this.state;
    }
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
    const targetPose = samplePose(this.state, this.time, progress);

    if (this._blendElapsed < BLEND_DURATION) {
      this._blendElapsed = Math.min(BLEND_DURATION, this._blendElapsed + step);
      const k = easeInOutCubic(this._blendElapsed / BLEND_DURATION);
      for (const key in targetPose) {
        this._pose[key] = lerp(this._fromPose[key], targetPose[key], k);
      }
    } else {
      this._pose = targetPose;
    }

    this.phase += step * this._pose.waveFreq;

    if (dur && this.stateTime >= dur) {
      const finishedState = this.state;
      const fallback = this.previousState || 'breathing';
      this._fromPose = { ...this._pose };
      this._blendElapsed = 0;
      this.state = fallback;
      this.stateTime = 0;

      const cbs = this._listeners.get(finishedState);
      if (cbs) {
        for (const cb of cbs) cb(finishedState);
      }
    }
  }

  _buildSpine(L, W) {
    const count = 8;
    const halfL = L * 0.5;
    const bodyL = L * 0.78;
    const noseX = halfL * 0.88;
    const pts = [];
    // Plump head-heavy chibi clownfish width profile
    const widths = [0.0, 0.34, 0.49, 0.50, 0.45, 0.34, 0.21, 0.12];

    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const x = noseX - u * bodyL;
      const wave = Math.sin(this.phase - u * 3.1) * this._pose.waveAmp * L * (0.14 + u * u * 0.86);
      const bend = this._pose.turnBend * W * (u * u * 0.95);
      const y = wave + bend;
      const hw = widths[i] * W;
      pts.push({ x, y, hw, u });
    }
    return pts;
  }

  _traceBodyPath(ctx, pts, L, W) {
    const n = pts.length;
    const nose = pts[0];
    const topPts = [];
    const botPts = [];

    for (let i = 1; i < n; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const next = pts[Math.min(n - 1, i + 1)];
      const tx = next.x - prev.x;
      const ty = next.y - prev.y;
      const len = Math.hypot(tx, ty) || 1;
      const nx = -ty / len;
      const ny = tx / len;
      topPts.push({ x: curr.x + nx * curr.hw, y: curr.y + ny * curr.hw });
      botPts.push({ x: curr.x - nx * curr.hw, y: curr.y - ny * curr.hw });
    }

    ctx.beginPath();
    ctx.moveTo(nose.x, nose.y);
    ctx.bezierCurveTo(
      nose.x + L * 0.03, nose.y - W * 0.26,
      topPts[0].x + L * 0.05, topPts[0].y - W * 0.05,
      topPts[0].x, topPts[0].y
    );
    for (let i = 0; i < topPts.length - 1; i++) {
      const c = topPts[i];
      const nx = topPts[i + 1];
      ctx.quadraticCurveTo(c.x, c.y, (c.x + nx.x) * 0.5, (c.y + nx.y) * 0.5);
    }
    const lastT = topPts[topPts.length - 1];
    const lastB = botPts[botPts.length - 1];
    const tailBase = pts[n - 1];
    ctx.lineTo(lastT.x, lastT.y);
    ctx.quadraticCurveTo(tailBase.x - L * 0.03, tailBase.y, lastB.x, lastB.y);

    for (let i = botPts.length - 1; i > 0; i--) {
      const c = botPts[i];
      const pr = botPts[i - 1];
      ctx.quadraticCurveTo(c.x, c.y, (c.x + pr.x) * 0.5, (c.y + pr.y) * 0.5);
    }
    ctx.bezierCurveTo(
      botPts[0].x + L * 0.05, botPts[0].y + W * 0.05,
      nose.x + L * 0.03, nose.y + W * 0.26,
      nose.x, nose.y
    );
    ctx.closePath();
  }

  _drawCaudalFin(ctx, pts, L, W) {
    const tail = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const dir = Math.atan2(tail.y - prev.y, tail.x - prev.x);
    const wag = Math.sin(this.phase - 3.6) * 0.26 + this._pose.turnBend * 0.4;

    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(dir + wag);

    const finL = L * 0.27;
    const finH = W * 0.44;

    const grad = ctx.createLinearGradient(0, 0, finL, 0);
    grad.addColorStop(0, '#FF7A24');
    grad.addColorStop(0.62, '#FF5C10');
    grad.addColorStop(0.84, '#2A1B16');
    grad.addColorStop(1, '#1A110E');

    ctx.beginPath();
    ctx.moveTo(0, -W * 0.10);
    ctx.bezierCurveTo(finL * 0.45, -finH * 0.95, finL * 1.05, -finH * 0.88, finL * 1.04, 0);
    ctx.bezierCurveTo(finL * 1.05, finH * 0.88, finL * 0.45, finH * 0.95, 0, W * 0.10);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Translucent orange inner glow & fin rays
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255, 224, 178, 0.52)';
    ctx.lineWidth = 0.85;
    for (let i = -3; i <= 3; i++) {
      const ang = i * 0.16;
      ctx.beginPath();
      ctx.moveTo(1, i * 0.8);
      ctx.quadraticCurveTo(finL * 0.5, Math.sin(ang) * finH * 0.55, finL * 0.86, Math.sin(ang) * finH * 0.85);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = '#1E130F';
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawPectoralFins(ctx, pts, L, W) {
    const anchor = pts[2];
    const flutter = Math.sin(this.time * this._pose.finFreq) * this._pose.finSweep;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(anchor.x + L * 0.02, anchor.y + side * W * 0.42);
      const baseRot = side * (0.62 + flutter * (side === 1 ? 1 : -0.85));
      ctx.rotate(baseRot);

      const fL = L * 0.22;
      const fW = W * 0.25;

      const grad = ctx.createRadialGradient(0, 0, 1, -fL * 0.35, side * fW * 0.35, fL * 1.15);
      grad.addColorStop(0, 'rgba(255, 152, 56, 0.94)');
      grad.addColorStop(0.66, 'rgba(255, 102, 24, 0.90)');
      grad.addColorStop(0.84, '#241712');
      grad.addColorStop(1, '#1A100D');

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        fL * 0.28, side * fW * 0.65,
        -fL * 0.55, side * fW * 1.25,
        -fL * 0.98, side * fW * 0.58
      );
      ctx.bezierCurveTo(
        -fL * 1.05, side * fW * 0.12,
        -fL * 0.38, -side * fW * 0.08,
        0, 0
      );
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Fin rays
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(255, 232, 198, 0.5)';
      ctx.lineWidth = 0.75;
      for (let r = 0; r < 4; r++) {
        const k = r / 3;
        ctx.beginPath();
        ctx.moveTo(-1, side * 1);
        ctx.lineTo(-fL * (0.4 + k * 0.45), side * fW * (0.45 + (1 - k) * 0.48));
        ctx.stroke();
      }
      ctx.restore();

      ctx.strokeStyle = '#1E130F';
      ctx.lineWidth = 1.7;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawWhiteBands(ctx, pts, L, W) {
    // 3 iconic wavy white clownfish bands with crisp black borders and subtle cyan inner shading
    const drawBand = (cx, cy, halfThick, curveBias, amp) => {
      const topY = cy - W * 0.72;
      const botY = cy + W * 0.72;

      const traceBand = (inset) => {
        const t = Math.max(0.8, halfThick - inset);
        ctx.beginPath();
        ctx.moveTo(cx + t, topY);
        ctx.bezierCurveTo(
          cx + t + curveBias + amp, cy - W * 0.22,
          cx + t + curveBias - amp, cy + W * 0.22,
          cx + t, botY
        );
        ctx.lineTo(cx - t, botY);
        ctx.bezierCurveTo(
          cx - t + curveBias - amp, cy + W * 0.22,
          cx - t + curveBias + amp, cy - W * 0.22,
          cx - t, topY
        );
        ctx.closePath();
      };

      // Outer crisp black border
      traceBand(-1.55);
      ctx.fillStyle = '#1C1412';
      ctx.fill();

      // White core with subtle cyan cel-shading on edges
      traceBand(0.2);
      const g = ctx.createLinearGradient(cx, topY, cx, botY);
      g.addColorStop(0, '#D4F1F9');
      g.addColorStop(0.26, '#FFFFFF');
      g.addColorStop(0.74, '#FFFFFF');
      g.addColorStop(1, '#CDEBF5');
      ctx.fillStyle = g;
      ctx.fill();
    };

    // Band 1: Head band behind eyes
    drawBand(pts[1].x - L * 0.01, pts[1].y, L * 0.052, -2.0, 1.6);
    // Band 2: Thick central saddle band with forward chibi bulge
    drawBand(pts[3].x - L * 0.01, pts[3].y, L * 0.068, 3.2, 2.2);
    // Band 3: Tail peduncle band
    drawBand(pts[6].x + L * 0.01, pts[6].y, L * 0.040, -1.2, 1.0);
  }

  _drawDorsalRidge(ctx, pts, L, W) {
    // Top-down stubby dorsal fin ridge undulating gently
    const sway = Math.sin(this.phase - 1.2) * W * 0.09;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[2].x, pts[2].y);
    ctx.bezierCurveTo(
      pts[3].x, pts[3].y - W * 0.12 + sway,
      pts[4].x, pts[4].y - W * 0.14 + sway * 1.2,
      pts[5].x, pts[5].y + sway * 0.6
    );
    ctx.bezierCurveTo(
      pts[4].x, pts[4].y + W * 0.08 + sway * 0.7,
      pts[3].x, pts[3].y + W * 0.08 + sway * 0.5,
      pts[2].x, pts[2].y
    );
    ctx.closePath();

    const dg = ctx.createLinearGradient(pts[2].x, pts[2].y, pts[5].x, pts[5].y);
    dg.addColorStop(0, '#FF9E44');
    dg.addColorStop(0.65, '#FF6818');
    dg.addColorStop(1, '#261712');
    ctx.fillStyle = dg;
    ctx.fill();
    ctx.strokeStyle = '#1E130F';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }

  _drawChibiEyesAndEmotes(ctx, pts, L, W) {
    const head = pts[1];
    const eyeX = head.x + L * 0.055;
    const eyeSep = W * 0.30;
    const baseR = W * 0.165 * this._pose.eyeScale;
    const st = this.state;

    // Rosy chibi cheek blushes
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(eyeX - L * 0.06, head.y + side * (eyeSep + W * 0.08));
      const bg = ctx.createRadialGradient(0, 0, 0.5, 0, 0, W * 0.13);
      bg.addColorStop(0, 'rgba(255, 92, 128, 0.62)');
      bg.addColorStop(1, 'rgba(255, 92, 128, 0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(0, 0, W * 0.12, W * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Chibi mouth (chomping for eating/hungry or O-mouth for shock)
    if (this._pose.mouthOpen > 0.05) {
      const m = this._pose.mouthOpen;
      ctx.save();
      ctx.translate(pts[0].x - 1, pts[0].y);
      ctx.fillStyle = '#52151C';
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.2 * m + 1.0, 2.8 * m + 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FF7E9A';
      ctx.beginPath();
      ctx.ellipse(-0.6, 0, 1.2 * m, 1.4 * m, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1E130F';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }

    // Draw oversized glossy chibi eyes on both sides
    for (const side of [-1, 1]) {
      const ex = eyeX;
      const ey = head.y + side * eyeSep;
      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        // ^ ^ smiling chibi eyes
        ctx.strokeStyle = '#1C130F';
        ctx.lineWidth = 2.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, baseR * 0.78, -Math.PI * 0.42, Math.PI * 0.42, false);
        ctx.stroke();
      } else if (st === 'stress') {
        // > < scrunched chibi eyes
        ctx.strokeStyle = '#1C130F';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-baseR * 0.55, -baseR * 0.55);
        ctx.lineTo(baseR * 0.45, 0);
        ctx.lineTo(-baseR * 0.55, baseR * 0.55);
        ctx.stroke();
      } else {
        // Outer white sclera
        ctx.beginPath();
        ctx.arc(0, 0, baseR, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFDF9';
        ctx.fill();
        ctx.strokeStyle = '#1C130F';
        ctx.lineWidth = 1.65;
        ctx.stroke();

        // Colored iris glow (warm amber-gold for clownfish)
        const irisR = st === 'shock' ? baseR * 0.36 : baseR * 0.74;
        const irisGrad = ctx.createRadialGradient(0.4, -0.4, irisR * 0.15, 0, 0, irisR);
        irisGrad.addColorStop(0, '#2B160E');
        irisGrad.addColorStop(0.55, '#1D0F0B');
        irisGrad.addColorStop(0.84, '#FF9E2C');
        irisGrad.addColorStop(1, '#FFD26A');
        ctx.beginPath();
        ctx.arc(0.4, 0, irisR, 0, Math.PI * 2);
        ctx.fillStyle = irisGrad;
        ctx.fill();

        if (st === 'hungry') {
          // Starry sparkling catchlight
          ctx.fillStyle = '#FFF8B8';
          this._drawFourPointStar(ctx, 0.8, -0.5, baseR * 0.55);
        } else {
          // Dual specular catchlights
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(baseR * 0.28, -baseR * 0.30, baseR * 0.30, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(-baseR * 0.25, baseR * 0.28, baseR * 0.14, 0, Math.PI * 2);
          ctx.fill();
        }

        // Mood eyelid overlays
        if (st === 'relax') {
          ctx.fillStyle = '#FF7A24';
          ctx.beginPath();
          ctx.arc(0, 0, baseR + 0.4, Math.PI * 0.65, Math.PI * 1.35);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#1C130F';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-baseR * 0.4, -baseR * 0.85);
          ctx.lineTo(-baseR * 0.4, baseR * 0.85);
          ctx.stroke();
        } else if (st === 'sad' || st === 'fear') {
          // Watery teary shimmer at lower rim
          ctx.fillStyle = 'rgba(130, 224, 255, 0.88)';
          ctx.beginPath();
          ctx.ellipse(-baseR * 0.32, side * baseR * 0.45, baseR * 0.38, baseR * 0.24, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // Floating mood emotes
    if (st === 'happy') {
      const pulse = 0.8 + Math.sin(this.time * 8) * 0.25;
      ctx.fillStyle = '#FFE45E';
      ctx.strokeStyle = '#C97B00';
      ctx.lineWidth = 0.8;
      this._drawFourPointStar(ctx, pts[0].x + 4, -W * 0.48, 4.2 * pulse);
      this._drawFourPointStar(ctx, pts[1].x + 2, W * 0.56, 3.2 * pulse);
    } else if (st === 'shock') {
      ctx.save();
      ctx.translate(pts[0].x + 8, -W * 0.35);
      ctx.fillStyle = '#FF3B30';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.0;
      ctx.font = 'bold 13px sans-serif';
      ctx.strokeText('!', 0, 0);
      ctx.fillText('!', 0, 0);
      ctx.restore();
    } else if (st === 'fear' || st === 'stress') {
      // Animated sweat drop
      const dropSlide = (this.time * 12) % 4;
      ctx.save();
      ctx.translate(pts[1].x - 3 - dropSlide * 0.5, -W * 0.52);
      ctx.fillStyle = '#7CE4FF';
      ctx.strokeStyle = '#1E5B88';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.quadraticCurveTo(-2, -3.5, -4, 0);
      ctx.quadraticCurveTo(-2, 3.5, 4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawFourPointStar(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const rad = i % 2 === 0 ? r : r * 0.34;
      const px = cx + Math.cos(a) * rad;
      const py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  draw(ctx) {
    if (!ctx) return;
    const L = Clownfish.metadata.baseLength;
    const W = Clownfish.metadata.baseWidth;
    const shiverX = this._pose.shiver ? Math.sin(this.time * 58) * this._pose.shiver : 0;
    const shiverY = this._pose.shiver ? Math.cos(this.time * 67) * this._pose.shiver : 0;

    ctx.save();
    ctx.translate(this.x + shiverX, this.y + this._pose.bobY + shiverY);
    ctx.rotate(this.angle);
    ctx.scale(this.scale * this._pose.squashX, this.scale * this._pose.squashY);

    const pts = this._buildSpine(L, W);

    // Soft underwater drop shadow
    ctx.save();
    ctx.translate(-2, 4);
    this._traceBodyPath(ctx, pts, L, W);
    ctx.fillStyle = 'rgba(10, 24, 42, 0.22)';
    ctx.fill();
    ctx.restore();

    // Fins under body
    this._drawCaudalFin(ctx, pts, L, W);
    this._drawPectoralFins(ctx, pts, L, W);

    // Main plump orange chibi body
    this._traceBodyPath(ctx, pts, L, W);
    const bodyGrad = ctx.createLinearGradient(pts[0].x, -W * 0.55, pts[0].x, W * 0.55);
    bodyGrad.addColorStop(0, '#FF9D3B');
    bodyGrad.addColorStop(0.28, '#FF6D1A');
    bodyGrad.addColorStop(0.72, '#FF5C12');
    bodyGrad.addColorStop(1, '#CC3A08');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Clipped markings & cel-shading
    ctx.save();
    this._traceBodyPath(ctx, pts, L, W);
    ctx.clip();

    this._drawWhiteBands(ctx, pts, L, W);

    // Lateral cel-shade rim
    ctx.strokeStyle = 'rgba(130, 26, 4, 0.34)';
    ctx.lineWidth = 5.5;
    this._traceBodyPath(ctx, pts, L, W);
    ctx.stroke();

    // Glossy jelly-bean dorsal highlight
    const hlGrad = ctx.createLinearGradient(pts[0].x, -W * 0.32, pts[4].x, W * 0.1);
    hlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.56)');
    hlGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.16)');
    hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = hlGrad;
    ctx.beginPath();
    ctx.ellipse(pts[2].x + 2, pts[2].y - W * 0.13, L * 0.24, W * 0.13, -0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bold tapered chibi ink outline
    this._traceBodyPath(ctx, pts, L, W);
    ctx.strokeStyle = '#1E130F';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Dorsal fin ridge on top
    this._drawDorsalRidge(ctx, pts, L, W);

    // Expressive chibi eyes & emotes
    this._drawChibiEyesAndEmotes(ctx, pts, L, W);

    ctx.restore();
  }
}

export default Clownfish;
