/**
 * Villain Siamese Betta — Standalone 2D Top-Down Expressive Chibi Villain ES Module
 * Concept: Shadow-indigo to blood-crimson body, huge tattered & spiked royal-villain
 * veil fins with glowing magenta veins, fierce crown-like brow.
 */

const OUTLINE = '#140B1C';
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const BLOCKED_IN_LOCK = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIAS_MAP = { idle: 'breathing', hunger: 'hungry' };
const DURATIONS = { left_turn: 0.58, right_turn: 0.58, eating: 0.62, shock: 0.75 };

const STATE_POSES = {
  breathing:  { freq: 2.6, amp: 0.22, veilWave: 2.2, finFlare: 0.55, bend: 0.0,  jaw: 0.10, brow: 0.55, lid: 1.0,  aura: 0.55, shake: 0.0 },
  swimming:   { freq: 6.4, amp: 0.42, veilWave: 5.8, finFlare: 0.35, bend: 0.0,  jaw: 0.16, brow: 0.65, lid: 1.0,  aura: 0.75, shake: 0.0 },
  relax:      { freq: 1.5, amp: 0.14, veilWave: 1.4, finFlare: 0.78, bend: 0.0,  jaw: 0.05, brow: 0.30, lid: 0.45, aura: 0.42, shake: 0.0 },
  left_turn:  { freq: 5.8, amp: 0.34, veilWave: 5.0, finFlare: 0.68, bend: -0.62, jaw: 0.14, brow: 0.60, lid: 1.0,  aura: 0.70, shake: 0.0 },
  right_turn: { freq: 5.8, amp: 0.34, veilWave: 5.0, finFlare: 0.68, bend: 0.62,  jaw: 0.14, brow: 0.60, lid: 1.0,  aura: 0.70, shake: 0.0 },
  eating:     { freq: 7.5, amp: 0.30, veilWave: 6.5, finFlare: 0.85, bend: 0.0,  jaw: 1.0,  brow: 0.85, lid: 1.05, aura: 0.90, shake: 0.18 },
  hungry:     { freq: 5.0, amp: 0.28, veilWave: 4.5, finFlare: 0.72, bend: 0.0,  jaw: 0.68, brow: 0.88, lid: 1.12, aura: 0.95, shake: 0.10 },
  stress:     { freq: 8.8, amp: 0.18, veilWave: 8.2, finFlare: 0.45, bend: 0.0,  jaw: 0.32, brow: 0.95, lid: 0.28, aura: 0.82, shake: 1.15 },
  fear:       { freq: 9.8, amp: 0.24, veilWave: 9.0, finFlare: 0.22, bend: 0.0,  jaw: 0.50, brow: -0.45, lid: 1.35, aura: 0.22, shake: 1.40 },
  shock:      { freq: 1.8, amp: 0.07, veilWave: 2.0, finFlare: 0.95, bend: 0.0,  jaw: 0.82, brow: -0.60, lid: 1.48, aura: 0.20, shake: 1.65 },
  happy:      { freq: 4.8, amp: 0.36, veilWave: 4.4, finFlare: 0.88, bend: 0.0,  jaw: 0.58, brow: 0.42, lid: 0.70, aura: 1.0,  shake: 0.0 },
  sad:        { freq: 1.2, amp: 0.08, veilWave: 1.0, finFlare: 0.16, bend: 0.0,  jaw: 0.04, brow: -0.35, lid: 0.65, aura: 0.20, shake: 0.0 },
};

function easeCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class VillainBettafish {
  static metadata = {
    name: 'Villain Siamese Betta',
    category: 'villain_fish',
    baseLength: 75,
    baseWidth: 42,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;

    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateElapsed = 0;
    this._clock = 0;
    this._swimPhase = 0;
    this._veilPhase = 0;

    this._blendDur = 0.15;
    this._blendTimer = 0.15;
    this._startPose = { ...STATE_POSES.breathing };
    this._endPose = { ...STATE_POSES.breathing };
    this._cur = { ...STATE_POSES.breathing };
    this._listeners = new Map();
  }

  getState() {
    return this._state;
  }

  setAngle(radians) {
    if (Number.isFinite(radians)) this.angle = radians;
  }

  setDirection(dx, dy) {
    if ((dx !== 0 || dy !== 0) && Number.isFinite(dx) && Number.isFinite(dy)) {
      this.angle = Math.atan2(dy, dx);
    }
  }

  onFinished(name, callback) {
    if (typeof callback !== 'function') return;
    const key = ALIAS_MAP[name] || name;
    if (!this._listeners.has(key)) this._listeners.set(key, []);
    this._listeners.get(key).push(callback);
  }

  play(name) {
    const target = ALIAS_MAP[name] || name;
    if (!STATE_POSES[target]) return;

    if ((this._state === 'shock' || this._state === 'fear') && BLOCKED_IN_LOCK.has(target)) {
      return;
    }
    if (target === this._state && !ONE_SHOTS.has(target)) return;

    if (ONE_SHOTS.has(target) && !ONE_SHOTS.has(this._state)) {
      this._prevState = this._state;
    }
    this._state = target;
    this._stateElapsed = 0;
    this._startPose = { ...this._cur };
    this._endPose = { ...STATE_POSES[target] };
    this._blendTimer = 0;
  }

  update(dt) {
    const step = Number.isFinite(dt) && dt > 0 ? dt : 0;
    this._clock += step;
    this._stateElapsed += step;

    if (this._blendTimer < this._blendDur) {
      this._blendTimer = Math.min(this._blendDur, this._blendTimer + step);
      const k = easeCubic(this._blendTimer / this._blendDur);
      for (const prop of Object.keys(this._cur)) {
        this._cur[prop] = this._startPose[prop] + (this._endPose[prop] - this._startPose[prop]) * k;
      }
    } else {
      for (const prop of Object.keys(this._cur)) {
        this._cur[prop] = this._endPose[prop];
      }
    }

    this._swimPhase += step * this._cur.freq;
    this._veilPhase += step * this._cur.veilWave;

    if (ONE_SHOTS.has(this._state) && this._stateElapsed >= DURATIONS[this._state]) {
      const doneState = this._state;
      const fallback = STATE_POSES[this._prevState] && !ONE_SHOTS.has(this._prevState)
        ? this._prevState
        : 'breathing';
      this._state = fallback;
      this._stateElapsed = 0;
      this._startPose = { ...this._cur };
      this._endPose = { ...STATE_POSES[fallback] };
      this._blendTimer = 0;

      const cbs = this._listeners.get(doneState);
      if (cbs) {
        for (const fn of cbs) fn(doneState);
      }
    }
  }

  draw(ctx) {
    const p = this._cur;
    const t = this._clock;
    const halfL = VillainBettafish.metadata.baseLength * 0.5;
    const halfW = VillainBettafish.metadata.baseWidth * 0.5;

    const tailSway = Math.sin(this._swimPhase) * p.amp + p.bend * 0.7;
    const midBend = Math.sin(this._swimPhase - 0.8) * p.amp * 0.28 + p.bend * 0.35;
    const jx = p.shake > 0 ? Math.sin(t * 55) * p.shake * 1.1 : 0;
    const jy = p.shake > 0 ? Math.cos(t * 62) * p.shake * 1.2 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Royal-villain abyssal magenta-indigo aura
    this._drawRoyalAura(ctx, halfL, halfW, p.aura, t);

    // 2. Huge tattered & spiked royal-villain veil tail (layered flowing ribbons)
    this._drawTatteredVeilTail(ctx, -halfL * 0.25, midBend * 8, tailSway, p.finFlare, t);

    // 3. Sweeping tattered pectoral veil wings
    this._drawVeilPectoral(ctx, 11, -halfW * 0.42, -1, p.finFlare, t);
    this._drawVeilPectoral(ctx, 11, halfW * 0.42, 1, p.finFlare, t);

    // 4. Shadow-indigo to blood-crimson chunky chibi betta body
    this._drawBettaBody(ctx, halfL, halfW, midBend, t);

    // 5. Flowing spiked dorsal veil ribbon along top spine
    this._drawDorsalVeilRibbon(ctx, midBend, tailSway, t);

    // 6. Fierce crown-like brow crest on forehead
    this._drawCrownCrest(ctx, halfL, t);

    // 7. Fanged royal scowl / chomp
    this._drawRoyalMouth(ctx, halfL, p.jaw, t);

    // 8. Expressive villain eyes
    this._drawBettaEyes(ctx, halfL, halfW, p, t);

    // 9. Mood-reactive overlays
    this._drawMoodOverlays(ctx, halfL, halfW, t);

    ctx.restore();
  }

  _drawRoyalAura(ctx, halfL, halfW, aura, t) {
    const r = halfL * (1.15 + Math.sin(t * 2.2) * 0.05);
    const g = ctx.createRadialGradient(-6, 0, 5, -6, 0, r);
    g.addColorStop(0, `rgba(26, 8, 44, ${0.46 * aura})`);
    g.addColorStop(0.5, `rgba(175, 16, 95, ${0.24 * aura})`);
    g.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-6, 0, r, halfW * 1.25, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawTatteredVeilTail(ctx, startX, startY, sway, flare, t) {
    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate(sway * 0.85);

    const spreadY = 16 + flare * 12;
    const len = 30 + flare * 6;
    const wave1 = Math.sin(this._veilPhase) * 3.5;
    const wave2 = Math.cos(this._veilPhase * 1.3) * 3.0;

    // Outer tattered translucent crimson-indigo veil
    const veilGrad = ctx.createLinearGradient(0, 0, -len, 0);
    veilGrad.addColorStop(0, '#4E1138');
    veilGrad.addColorStop(0.45, '#B3123A');
    veilGrad.addColorStop(0.82, '#6A0F4E');
    veilGrad.addColorStop(1, '#1A0B24');

    ctx.fillStyle = veilGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(2, -5);
    ctx.bezierCurveTo(-8, -spreadY * 0.85 + wave1, -len * 0.65, -spreadY * 1.05 - wave2, -len, -spreadY * 0.72 + wave1);
    // Spiked tattered crown-tail edge (6 sharp points)
    ctx.lineTo(-len * 0.74, -spreadY * 0.42 + wave2 * 0.5);
    ctx.lineTo(-len * 1.06, -spreadY * 0.25 + wave1);
    ctx.lineTo(-len * 0.76, -spreadY * 0.05);
    ctx.lineTo(-len * 1.08, spreadY * 0.14 - wave2);
    ctx.lineTo(-len * 0.74, spreadY * 0.36 + wave1 * 0.4);
    ctx.lineTo(-len * 0.98, spreadY * 0.74 - wave1);
    ctx.bezierCurveTo(-len * 0.62, spreadY * 1.05 + wave2, -8, spreadY * 0.85 - wave1, 2, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing magenta veins radiating through the royal veil
    ctx.strokeStyle = `rgba(255, 58, 178, ${0.65 + Math.sin(t * 5) * 0.2})`;
    ctx.lineWidth = 1.25;
    const rayAngles = [-0.62, -0.35, -0.1, 0.14, 0.4, 0.64];
    for (let i = 0; i < rayAngles.length; i++) {
      const a = rayAngles[i];
      const rx = -Math.cos(a) * len * 0.88;
      const ry = Math.sin(a) * spreadY * 0.9 + (i % 2 === 0 ? wave1 * 0.4 : -wave2 * 0.4);
      ctx.beginPath();
      ctx.moveTo(-1, Math.sin(a) * 3.5);
      ctx.quadraticCurveTo(rx * 0.5, ry * 0.65, rx, ry);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawVeilPectoral(ctx, ox, oy, side, flare, t) {
    ctx.save();
    ctx.translate(ox, oy);
    const flutter = Math.sin(this._veilPhase * 1.2 + side) * 0.18;
    ctx.rotate(side * (0.28 + flare * 0.55 + flutter));

    const g = ctx.createLinearGradient(0, 0, -14, side * 20);
    g.addColorStop(0, '#3C1659');
    g.addColorStop(0.55, '#C41748');
    g.addColorStop(1, '#1A0B24');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.9;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.quadraticCurveTo(5, side * 12, -2, side * 19);
    ctx.lineTo(-5, side * 13);
    ctx.lineTo(-10, side * 18);
    ctx.lineTo(-11, side * 11);
    ctx.lineTo(-15, side * 13);
    ctx.quadraticCurveTo(-13, side * 5, -7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing magenta vein lines
    ctx.strokeStyle = `rgba(255, 72, 196, ${0.55 + Math.sin(t * 4.5 + side) * 0.2})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(1, side * 2);
    ctx.lineTo(-3, side * 15);
    ctx.moveTo(-3, side * 2);
    ctx.lineTo(-10, side * 14);
    ctx.stroke();
    ctx.restore();
  }

  _drawBettaBody(ctx, halfL, halfW, midBend, t) {
    const sy = midBend * 5.5;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(halfL * 0.88, 0);
    ctx.bezierCurveTo(halfL * 0.85, -halfW * 0.68, halfL * 0.25, -halfW * 0.72, -halfL * 0.18, -halfW * 0.42 + sy * 0.5);
    ctx.quadraticCurveTo(-halfL * 0.35, -halfW * 0.24 + sy, -halfL * 0.44, -halfW * 0.16 + sy);
    ctx.lineTo(-halfL * 0.44, halfW * 0.16 + sy);
    ctx.quadraticCurveTo(-halfL * 0.35, halfW * 0.24 + sy, -halfL * 0.18, halfW * 0.42 + sy * 0.5);
    ctx.bezierCurveTo(halfL * 0.25, halfW * 0.72, halfL * 0.85, halfW * 0.68, halfL * 0.88, 0);
    ctx.closePath();

    // Shadow-indigo head fading into blood-crimson royal flanks
    const bg = ctx.createLinearGradient(halfL * 0.9, 0, -halfL * 0.45, 0);
    bg.addColorStop(0, '#2B1654');
    bg.addColorStop(0.42, '#4A1252');
    bg.addColorStop(0.75, '#B8143A');
    bg.addColorStop(1, '#680B24');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    ctx.clip();

    // Dark cel-shaded lower edge
    ctx.fillStyle = 'rgba(20, 8, 28, 0.35)';
    ctx.beginPath();
    ctx.ellipse(4, halfW * 0.48, halfL * 0.7, halfW * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iridescent royal scale chevrons along mid-back
    ctx.strokeStyle = `rgba(255, 62, 165, ${0.42 + Math.sin(t * 3.8) * 0.15})`;
    ctx.lineWidth = 1.2;
    for (let sx = 12; sx >= -10; sx -= 5.5) {
      ctx.beginPath();
      ctx.moveTo(sx + 2, -6);
      ctx.lineTo(sx - 2, 0);
      ctx.lineTo(sx + 2, 6);
      ctx.stroke();
    }

    // Wet glossy specular sheen
    ctx.fillStyle = 'rgba(240, 200, 255, 0.30)';
    ctx.beginPath();
    ctx.ellipse(14, -halfW * 0.28, 12, 3.6, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.3;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawDorsalVeilRibbon(ctx, midBend, tailSway, t) {
    ctx.save();
    const w1 = Math.sin(this._veilPhase) * 2.8;
    const w2 = Math.cos(this._veilPhase) * 3.6;

    ctx.fillStyle = '#9E1242';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.quadraticCurveTo(0, -4.5 + w1, -12, -3.5 + midBend * 5 + w2);
    ctx.lineTo(-22, tailSway * 8);
    ctx.quadraticCurveTo(-8, 4.5 + midBend * 4 + w1, 10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 95, 210, ${0.65 + Math.sin(t * 5) * 0.2})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.quadraticCurveTo(-4, w1 * 0.7, -20, tailSway * 7);
    ctx.stroke();
    ctx.restore();
  }

  _drawCrownCrest(ctx, halfL, t) {
    // Fierce spiky royal-villain tiara/brow crest between the eyes
    ctx.save();
    ctx.translate(halfL * 0.44, 0);
    ctx.fillStyle = '#FF2A7A';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(-1, -5.8);
    ctx.lineTo(0.8, -2.0);
    ctx.lineTo(-4.5, 0);
    ctx.lineTo(0.8, 2.0);
    ctx.lineTo(-1, 5.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing jewel core
    ctx.fillStyle = `rgba(255, 210, 240, ${0.75 + Math.sin(t * 6) * 0.25})`;
    ctx.beginPath();
    ctx.arc(0.8, 0, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawRoyalMouth(ctx, halfL, jaw, t) {
    const mx = halfL * 0.82;
    const snap = this._state === 'eating' || this._state === 'hungry'
      ? Math.abs(Math.sin(t * 13)) * 0.45 + jaw * 0.55
      : jaw;

    if (snap > 0.22 || this._state === 'happy') {
      const w = 2.8 + snap * 3.8;
      ctx.save();
      ctx.fillStyle = '#24071E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(mx + 1, 0, 2.0 + snap * 2.5, w, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tiny razor fangs
      ctx.fillStyle = '#FFF0F8';
      for (const fy of [-w * 0.5, w * 0.5]) {
        ctx.beginPath();
        ctx.moveTo(mx + 0.5, fy - 1.1);
        ctx.lineTo(mx + 3.8 + snap, fy);
        ctx.lineTo(mx + 0.5, fy + 1.1);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawBettaEyes(ctx, halfL, halfW, p, t) {
    const ex = halfL * 0.58;
    const ey = halfW * 0.34;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(ex, side * ey);

      if (this._state === 'stress') {
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.4, -side * 2.4);
        ctx.lineTo(2.0, 0);
        ctx.lineTo(-2.4, side * 2.4);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const rx = 4.0 * (this._state === 'shock' ? 1.25 : 1.0);
      const ry = 3.6 * Math.max(0.45, Math.min(1.38, p.lid));

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx + 1.2, ry + 1.1, side * 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFF0FA';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, side * 0.12, 0, Math.PI * 2);
      ctx.fill();

      // Neon-magenta / crimson glowing iris
      const ir = this._state === 'shock' ? 1.3 : 2.5;
      const ig = ctx.createRadialGradient(0.5, 0, 0.3, 0.5, 0, ir);
      ig.addColorStop(0, '#FF99EE');
      ig.addColorStop(0.55, '#FF1E7A');
      ig.addColorStop(1, '#580832');
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.arc(0.6, side * 0.25, ir, 0, Math.PI * 2);
      ctx.fill();

      // Slit pupil
      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0.8, side * 0.25, 0.85, ir * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dual catchlights
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(1.5, side * 0.25 - 1.0, 0.95, 0, Math.PI * 2);
      ctx.arc(-0.4, side * 0.25 + 0.9, 0.5, 0, Math.PI * 2);
      ctx.fill();

      if (this._state === 'relax' || this._state === 'happy') {
        ctx.fillStyle = '#2B1048';
        ctx.beginPath();
        ctx.ellipse(-0.9, 0, rx + 0.4, ry * 0.56, side * 0.12, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
      }

      // Fierce V-shaped crown brow
      const tilt = p.brow * 0.55;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-4.0, -side * (2.5 - tilt * 2.4));
      ctx.lineTo(4.6, -side * (1.4 + tilt * 2.6));
      ctx.stroke();

      if (this._state === 'hungry' || this._state === 'eating') {
        ctx.strokeStyle = `rgba(255, 80, 210, ${0.65 + Math.sin(t * 14) * 0.3})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(0.8, -4.5);
        ctx.lineTo(0.8, 4.5);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  _drawMoodOverlays(ctx, halfL, halfW, t) {
    if (this._state === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.3 + i * 1.57;
        const sx = 4 + Math.cos(a) * (halfL * 0.72);
        const sy = Math.sin(a) * (halfW * 0.95);
        const r = 2.8 + Math.sin(t * 6 + i) * 0.9;
        ctx.fillStyle = i % 2 === 0 ? '#FF2A85' : '#9B30FF';
        ctx.beginPath();
        ctx.moveTo(sx, sy - r);
        ctx.quadraticCurveTo(sx, sy, sx + r, sy);
        ctx.quadraticCurveTo(sx, sy, sx, sy + r);
        ctx.quadraticCurveTo(sx, sy, sx - r, sy);
        ctx.quadraticCurveTo(sx, sy, sx, sy - r);
        ctx.fill();
      }
    } else if (this._state === 'shock') {
      ctx.save();
      ctx.translate(halfL * 0.62, -halfW * 0.92);
      ctx.fillStyle = '#FF2858';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-2, -10, 4, 7.5, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 1.2, 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this._state === 'fear') {
      for (let i = 0; i < 2; i++) {
        const d = (t * 26 + i * 6) % 9;
        const x = 14 - i * 8;
        const y = -halfW * 0.75 - d * 0.55;
        ctx.fillStyle = '#7CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y - 3.5);
        ctx.quadraticCurveTo(x + 2.6, y + 1, x, y + 3);
        ctx.quadraticCurveTo(x - 2.6, y + 1, x, y - 3.5);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this._state === 'stress') {
      const s = 1 + Math.sin(t * 20) * 0.18;
      ctx.save();
      ctx.translate(12, -halfW * 0.72);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF2455';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.rotate(Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(1.7, 1.7);
        ctx.quadraticCurveTo(1.9, 4.4, 5.0, 4.7);
        ctx.stroke();
      }
      ctx.restore();
    } else if (this._state === 'sad') {
      const dy = (t * 14) % 7;
      ctx.fillStyle = '#72D6FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(halfL * 0.52, halfW * 0.56 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.52 + 2.3, halfW * 0.56 + 4 + dy * 0.5, halfL * 0.52, halfW * 0.56 + 5.5 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.52 - 2.3, halfW * 0.56 + 4 + dy * 0.5, halfL * 0.52, halfW * 0.56 + dy * 0.5);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainBettafish;
