/**
 * Villain Reef Stonefish — 2D Top-Down Expressive Chibi Villain Fish
 * Jagged volcanic obsidian-basalt craggy body with glowing lava fissures,
 * toxic-dripping dorsal venom spines, and fierce scowling mouth.
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOT_STATES = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED_FROM_STATES = new Set(['shock', 'fear']);
const BLOCKED_WHEN_LOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);

const STATE_ALIASES = { idle: 'breathing', hunger: 'hungry' };
const ONE_SHOT_DURATIONS = { left_turn: 0.58, right_turn: 0.58, eating: 0.64, shock: 0.72 };

function cubicEaseOut(t) {
  const c = Math.max(0, Math.min(1, t));
  return 1 - (1 - c) * (1 - c) * (1 - c);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function getTargetPose(state) {
  switch (state) {
    case 'swimming':
      return { swimFreq: 6.4, swimAmp: 0.22, bend: 0, puff: 1.0, jawOpen: 0.12, finFlare: 0.25, glow: 0.85, shake: 0 };
    case 'relax':
      return { swimFreq: 1.6, swimAmp: 0.05, bend: 0, puff: 1.03, jawOpen: 0.04, finFlare: 0.08, glow: 0.55, shake: 0 };
    case 'left_turn':
      return { swimFreq: 5.5, swimAmp: 0.16, bend: -0.36, puff: 1.0, jawOpen: 0.15, finFlare: 0.42, glow: 0.9, shake: 0 };
    case 'right_turn':
      return { swimFreq: 5.5, swimAmp: 0.16, bend: 0.36, puff: 1.0, jawOpen: 0.15, finFlare: 0.42, glow: 0.9, shake: 0 };
    case 'eating':
      return { swimFreq: 5.0, swimAmp: 0.14, bend: 0, puff: 1.06, jawOpen: 0.95, finFlare: 0.5, glow: 1.15, shake: 0.02 };
    case 'hungry':
      return { swimFreq: 4.8, swimAmp: 0.16, bend: 0, puff: 1.02, jawOpen: 0.58, finFlare: 0.38, glow: 1.2, shake: 0.015 };
    case 'stress':
      return { swimFreq: 8.8, swimAmp: 0.1, bend: 0, puff: 1.05, jawOpen: 0.28, finFlare: 0.65, glow: 1.3, shake: 0.06 };
    case 'fear':
      return { swimFreq: 10.5, swimAmp: 0.15, bend: 0, puff: 0.95, jawOpen: 0.45, finFlare: 0.72, glow: 0.45, shake: 0.085 };
    case 'shock':
      return { swimFreq: 12.0, swimAmp: 0.08, bend: 0, puff: 1.14, jawOpen: 0.78, finFlare: 0.85, glow: 1.35, shake: 0.1 };
    case 'happy':
      return { swimFreq: 3.6, swimAmp: 0.12, bend: 0.05, puff: 1.04, jawOpen: 0.22, finFlare: 0.32, glow: 1.05, shake: 0 };
    case 'sad':
      return { swimFreq: 1.4, swimAmp: 0.04, bend: -0.06, puff: 0.96, jawOpen: 0.02, finFlare: -0.18, glow: 0.35, shake: 0 };
    case 'breathing':
    default:
      return { swimFreq: 2.3, swimAmp: 0.07, bend: 0, puff: 1.0, jawOpen: 0.08, finFlare: 0.14, glow: 0.75, shake: 0 };
  }
}

export class VillainStonefish {
  static metadata = {
    name: 'Villain Reef Stonefish',
    category: 'villain_fish',
    baseLength: 92,
    baseWidth: 64
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;

    this._state = 'breathing';
    this._prevState = 'breathing';
    this._time = 0;
    this._stateTime = 0;
    this._phase = 0;

    this._blendDuration = 0.15;
    this._blendElapsed = 0.15;
    this._fromPose = getTargetPose('breathing');
    this._toPose = getTargetPose('breathing');
    this._pose = { ...this._toPose };

    this._listeners = new Map();
  }

  play(name) {
    const canonical = STATE_ALIASES[name] || name;
    if (!VALID_STATES.has(canonical)) return this;
    if (LOCKED_FROM_STATES.has(this._state) && BLOCKED_WHEN_LOCKED.has(canonical)) {
      return this;
    }
    if (canonical === this._state && !ONE_SHOT_STATES.has(canonical)) {
      return this;
    }
    if (!ONE_SHOT_STATES.has(this._state)) {
      this._prevState = this._state;
    }
    this._fromPose = { ...this._pose };
    this._toPose = getTargetPose(canonical);
    this._blendElapsed = 0;
    this._state = canonical;
    this._stateTime = 0;
    return this;
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    const step = Math.min(dt, 0.1);
    this._time += step;
    this._stateTime += step;

    if (this._blendElapsed < this._blendDuration) {
      this._blendElapsed = Math.min(this._blendDuration, this._blendElapsed + step);
      const t = cubicEaseOut(this._blendElapsed / this._blendDuration);
      for (const key of Object.keys(this._pose)) {
        this._pose[key] = lerp(this._fromPose[key], this._toPose[key], t);
      }
    } else {
      for (const key of Object.keys(this._pose)) {
        this._pose[key] = this._toPose[key];
      }
    }

    this._phase += step * this._pose.swimFreq;

    if (ONE_SHOT_STATES.has(this._state)) {
      const dur = ONE_SHOT_DURATIONS[this._state] || 0.6;
      if (this._stateTime >= dur) {
        const finished = this._state;
        const returnTo = this._prevState || 'breathing';
        this._fromPose = { ...this._pose };
        this._toPose = getTargetPose(returnTo);
        this._blendElapsed = 0;
        this._state = returnTo;
        this._stateTime = 0;
        this._emitFinished(finished);
      }
    }
  }

  setAngle(radians) {
    if (Number.isFinite(radians)) this.angle = radians;
  }

  setDirection(dx, dy) {
    if (dx !== 0 || dy !== 0) {
      this.angle = Math.atan2(dy, dx);
    }
  }

  getState() {
    return this._state;
  }

  onFinished(name, callback) {
    if (typeof callback !== 'function') return this;
    const canonical = STATE_ALIASES[name] || name;
    if (!this._listeners.has(canonical)) {
      this._listeners.set(canonical, []);
    }
    this._listeners.get(canonical).push(callback);
    return this;
  }

  _emitFinished(name) {
    const list = this._listeners.get(name);
    if (!list) return;
    for (const cb of list.slice()) {
      cb(name, this);
    }
  }

  draw(ctx) {
    if (!ctx) return;
    const p = this._pose;
    const t = this._time;
    const wag = Math.sin(this._phase) * p.swimAmp;
    const breath = 1 + Math.sin(t * 2.8) * 0.025;
    const puff = p.puff * breath;
    const bend = p.bend + wag * 0.35;
    const shakeX = p.shake ? Math.sin(t * 58) * p.shake * 22 : 0;
    const shakeY = p.shake ? Math.cos(t * 64) * p.shake * 22 : 0;
    const glowPulse = (0.72 + 0.28 * Math.sin(t * 4.2)) * p.glow;

    ctx.save();
    ctx.translate(this.x + shakeX, this.y + shakeY);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Dark volcanic miasma aura beneath
    const aura = ctx.createRadialGradient(-4, 0, 8, -4, 0, 56);
    aura.addColorStop(0, `rgba(22, 8, 28, ${0.52 * Math.min(1.2, p.glow)})`);
    aura.addColorStop(0.58, `rgba(180, 38, 12, ${0.22 * glowPulse})`);
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-4, 0, 54 * puff, 40 * puff, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rising toxic/ember miasma wisps
    for (let i = 0; i < 4; i++) {
      const a = t * 1.1 + i * 1.57;
      const wx = Math.cos(a) * 32 - 6;
      const wy = Math.sin(a) * 24;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(122, 255, 74, 0.16)' : 'rgba(255, 82, 24, 0.18)';
      ctx.beginPath();
      ctx.arc(wx, wy, 4.5 + Math.sin(t * 3 + i) * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Craggy notched volcanic tail fin
    ctx.save();
    ctx.translate(-34, bend * 14);
    ctx.rotate(-bend * 0.75 - wag * 1.15);
    const tailGrad = ctx.createLinearGradient(0, 0, -20, 0);
    tailGrad.addColorStop(0, '#2B2330');
    tailGrad.addColorStop(0.6, '#1E1622');
    tailGrad.addColorStop(1, '#5E1B16');
    ctx.fillStyle = tailGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(4, -7);
    ctx.lineTo(-13, -15);
    ctx.lineTo(-9, -7);
    ctx.lineTo(-18, -2);
    ctx.lineTo(-11, 2);
    ctx.lineTo(-17, 11);
    ctx.lineTo(-7, 14);
    ctx.lineTo(4, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing lava veins in tail
    ctx.strokeStyle = `rgba(255, 110, 32, ${0.7 * glowPulse})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(-10, -10);
    ctx.moveTo(0, 0);
    ctx.lineTo(-13, -1);
    ctx.moveTo(0, 3);
    ctx.lineTo(-11, 9);
    ctx.stroke();
    ctx.restore();

    // 3. Broad rocky fan pectoral fins (battle-notched volcanic basalt slabs)
    for (const side of [-1, 1]) {
      ctx.save();
      const flare = p.finFlare * 0.35 + Math.sin(this._phase + side) * 0.08;
      ctx.translate(6, side * 22 * puff);
      ctx.rotate(side * (0.35 + flare) + bend * 0.25);
      const finGrad = ctx.createLinearGradient(0, 0, -14, side * 18);
      finGrad.addColorStop(0, '#362D3B');
      finGrad.addColorStop(0.65, '#221A26');
      finGrad.addColorStop(1, '#782214');
      ctx.fillStyle = finGrad;
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(10, -side * 2);
      ctx.lineTo(14, side * 10);
      ctx.lineTo(6, side * 14);
      ctx.lineTo(4, side * 18);
      ctx.lineTo(-3, side * 14); // battle notch
      ctx.lineTo(-9, side * 19);
      ctx.lineTo(-16, side * 12);
      ctx.lineTo(-12, -side * 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cracked lava seams on pectoral slab
      ctx.strokeStyle = `rgba(255, 128, 28, ${0.75 * glowPulse})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(5, side * 2);
      ctx.lineTo(6, side * 12);
      ctx.moveTo(-2, side * 3);
      ctx.lineTo(-7, side * 14);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Chunky front-heavy craggy obsidian-basalt chibi body
    ctx.save();
    ctx.scale(puff, puff);
    const bodyGrad = ctx.createRadialGradient(8, -6, 6, 0, 0, 48);
    bodyGrad.addColorStop(0, '#4A3E52');
    bodyGrad.addColorStop(0.48, '#2D2433');
    bodyGrad.addColorStop(0.85, '#1D1522');
    bodyGrad.addColorStop(1, '#140B1C');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(41, 0);
    ctx.lineTo(37, -14);
    ctx.lineTo(28, -22);
    ctx.lineTo(16, -29);
    ctx.lineTo(2, -26);
    ctx.lineTo(-10, -28);
    ctx.lineTo(-24, -20);
    ctx.lineTo(-35, -10 + bend * 10);
    ctx.lineTo(-35, 10 + bend * 10);
    ctx.lineTo(-24, 20);
    ctx.lineTo(-10, 28);
    ctx.lineTo(2, 26);
    ctx.lineTo(16, 29);
    ctx.lineTo(28, 22);
    ctx.lineTo(37, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Layered dark cel-shading facets (volcanic rock plates)
    ctx.fillStyle = 'rgba(16, 9, 24, 0.45)';
    ctx.beginPath();
    ctx.moveTo(-34, 8 + bend * 8);
    ctx.lineTo(-20, 18);
    ctx.lineTo(12, 25);
    ctx.lineTo(34, 12);
    ctx.lineTo(26, 4);
    ctx.lineTo(-12, 8);
    ctx.closePath();
    ctx.fill();

    // Glossy basalt specular rim along top-left ridge
    ctx.fillStyle = 'rgba(170, 148, 194, 0.2)';
    ctx.beginPath();
    ctx.moveTo(26, -18);
    ctx.lineTo(12, -23);
    ctx.lineTo(-6, -20);
    ctx.lineTo(4, -12);
    ctx.lineTo(22, -11);
    ctx.closePath();
    ctx.fill();

    // 5. Glowing magma fissures cracking across the basalt shell
    ctx.save();
    ctx.strokeStyle = `rgba(255, 76, 18, ${0.88 * glowPulse})`;
    ctx.shadowColor = '#FF4D12';
    ctx.shadowBlur = 7 * glowPulse;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(24, -15);
    ctx.lineTo(12, -8);
    ctx.lineTo(4, -18);
    ctx.moveTo(12, -8);
    ctx.lineTo(-4, -3);
    ctx.lineTo(-18, -14);
    ctx.moveTo(-4, -3);
    ctx.lineTo(-14, 10);
    ctx.lineTo(-26, 7);
    ctx.moveTo(16, 16);
    ctx.lineTo(5, 8);
    ctx.lineTo(-5, 18);
    ctx.stroke();

    // Hot molten-gold inner core inside fissures
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(255, 224, 96, ${0.85 * glowPulse})`;
    ctx.lineWidth = 1.0;
    ctx.stroke();
    ctx.restore();

    // Battle scar across snout bridge
    ctx.strokeStyle = '#FF9C7A';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(27, -6);
    ctx.lineTo(34, 4);
    ctx.stroke();
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(29, -5);
    ctx.lineTo(27, -2);
    ctx.moveTo(32, -1);
    ctx.lineTo(30, 2);
    ctx.stroke();

    // 6. Toxic-dripping dorsal venom spines along spine ridge
    const spineXs = [8, -2, -12, -22, -30];
    for (let i = 0; i < spineXs.length; i++) {
      const sx = spineXs[i];
      const sy = bend * (i * 2.2);
      const spLen = 9 - i * 0.9;
      ctx.fillStyle = '#22172B';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(sx + 5, sy - 3.5);
      ctx.lineTo(sx - spLen, sy);
      ctx.lineTo(sx + 5, sy + 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing toxic emerald venom tip & bead
      const drip = Math.sin(t * 4.5 + i * 1.1) * 1.2;
      ctx.fillStyle = '#7DFF3B';
      ctx.beginPath();
      ctx.arc(sx - spLen + 1.5, sy + drip * 0.35, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#E8FFBE';
      ctx.beginPath();
      ctx.arc(sx - spLen + 2.1, sy - 0.6, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Fierce scowling underbite mouth + jagged fangs
    const chomp = this._state === 'eating'
      ? 0.45 + 0.55 * Math.abs(Math.sin(this._stateTime * 18))
      : this._state === 'hungry'
        ? 0.45 + 0.25 * Math.sin(t * 9)
        : p.jawOpen;

    ctx.save();
    ctx.translate(39, 0);
    if (chomp > 0.14 || this._state === 'happy') {
      const openH = 5 + chomp * 9;
      ctx.fillStyle = '#3B081B';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-4, -openH * 0.72);
      ctx.quadraticCurveTo(5 + chomp * 4, 0, -4, openH * 0.72);
      ctx.quadraticCurveTo(-7, 0, -4, -openH * 0.72);
      ctx.fill();
      ctx.stroke();

      // Jagged cartoon fangs
      ctx.fillStyle = '#FFF5E8';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 1.2;
      const fangYs = [-openH * 0.48, -openH * 0.16, openH * 0.16, openH * 0.48];
      for (const fy of fangYs) {
        ctx.beginPath();
        ctx.moveTo(-3, fy - 2.0);
        ctx.lineTo(2.4 + chomp * 1.8, fy);
        ctx.lineTo(-3, fy + 2.0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else {
      // Closed villainous scowl with poking bottom tusks
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-2, -9);
      ctx.quadraticCurveTo(2, 0, -2, 9);
      ctx.stroke();

      ctx.fillStyle = '#FFF5E8';
      ctx.lineWidth = 1.2;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(-1, side * 5.2);
        ctx.lineTo(3.5, side * 6.8);
        ctx.lineTo(-2.5, side * 8.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();

    // 8. Expressive Chibi Villain Eyes (left & right top-down)
    this._drawVillainEyes(ctx, t, glowPulse);

    ctx.restore(); // end body puff scale

    // 9. Mood-reactive overlay FX
    this._drawMoodFX(ctx, t);

    ctx.restore();
  }

  _drawVillainEyes(ctx, t, glowPulse) {
    const st = this._state;
    for (const side of [-1, 1]) {
      const ex = 21;
      const ey = side * 14.5;

      // Craggy eye socket ridge
      ctx.fillStyle = '#1B1124';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 7.6, 6.2, side * 0.18, 0, Math.PI * 2);
      ctx.fill();

      if (st === 'stress') {
        // Scrunched > < villain eyes
        ctx.strokeStyle = '#FF5D2A';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex - 4, ey - side * 3.2);
        ctx.lineTo(ex + 3.2, ey);
        ctx.lineTo(ex - 4, ey + side * 3.2);
        ctx.stroke();
        continue;
      }

      const eyeR = st === 'shock' ? 6.6 : 5.5;
      // Sclera / glowing ember socket
      ctx.fillStyle = st === 'shock' ? '#FFF8EE' : '#2A0912';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (st === 'shock') {
        // Hilariously rattled wide O-eye with tiny pinpoint pupil
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.arc(ex + 1.1, ey, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Glowing volcanic ember iris
        const irisR = st === 'hungry' ? 4.4 : 3.9;
        const irisGrad = ctx.createRadialGradient(ex + 1, ey, 0.8, ex, ey, irisR);
        irisGrad.addColorStop(0, '#FFF394');
        irisGrad.addColorStop(0.55, st === 'hungry' ? '#FF3B1F' : '#FF7B1C');
        irisGrad.addColorStop(1, '#9E1212');
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.arc(ex + 0.8, ey, irisR, 0, Math.PI * 2);
        ctx.fill();

        // Menacing slit pupil
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(ex + 1.2, ey, st === 'fear' ? 1.2 : 1.5, st === 'hungry' ? 3.4 : 2.9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dual catchlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex + 2.4, ey - side * 1.4, 1.35, 0, Math.PI * 2);
        ctx.arc(ex - 0.5, ey + side * 1.4, 0.75, 0, Math.PI * 2);
        ctx.fill();
      }

      // Eyelid for relax / happy / sad
      if (st === 'relax' || st === 'happy') {
        ctx.fillStyle = '#2B2133';
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR + 0.4, -Math.PI * 0.9, Math.PI * 0.15);
        ctx.closePath();
        ctx.fill();
      } else if (st === 'sad') {
        ctx.fillStyle = '#2B2133';
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR + 0.4, side < 0 ? Math.PI * 0.65 : -Math.PI * 1.15, side < 0 ? Math.PI * 1.4 : -Math.PI * 0.4);
        ctx.closePath();
        ctx.fill();
      }

      // Angled V-shaped villain brow
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(ex - 4.5, ey + side * 4.2);
        ctx.lineTo(ex + 4.8, ey + side * 6.5);
      } else if (st === 'shock') {
        ctx.moveTo(ex - 3.5, ey + side * 7.2);
        ctx.lineTo(ex + 4.5, ey + side * 7.2);
      } else {
        // Fierce inward V-scowl
        ctx.moveTo(ex + 5.2, ey - side * 2.2);
        ctx.lineTo(ex - 4.5, ey + side * 5.8);
      }
      ctx.stroke();

      // Blazing ember aura on hungry eyes
      if (st === 'hungry') {
        ctx.strokeStyle = `rgba(255, 84, 24, ${0.65 * glowPulse})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR + 2.2 + Math.sin(t * 14) * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  _drawMoodFX(ctx, t) {
    const st = this._state;
    if (st === 'happy') {
      // Dark purple & crimson evil cackle sparkles
      for (let i = 0; i < 4; i++) {
        const a = t * 2.6 + i * 1.57;
        const sx = 12 + Math.cos(a) * 34;
        const sy = Math.sin(a) * 30;
        const r = 3.2 + Math.sin(t * 7 + i) * 1.1;
        ctx.fillStyle = i % 2 === 0 ? '#D92662' : '#A442FF';
        ctx.beginPath();
        ctx.moveTo(sx, sy - r);
        ctx.lineTo(sx + r * 0.35, sy - r * 0.35);
        ctx.lineTo(sx + r, sy);
        ctx.lineTo(sx + r * 0.35, sy + r * 0.35);
        ctx.lineTo(sx, sy + r);
        ctx.lineTo(sx - r * 0.35, sy + r * 0.35);
        ctx.lineTo(sx - r, sy);
        ctx.lineTo(sx - r * 0.35, sy - r * 0.35);
        ctx.closePath();
        ctx.fill();
      }
    } else if (st === 'shock') {
      // Bold cartoon exclamation mark '!'
      const bounce = Math.abs(Math.sin(t * 18)) * 4;
      ctx.save();
      ctx.translate(34 + bounce, -26);
      ctx.fillStyle = '#FF3838';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.roundRect(-2.5, -13, 5, 11, 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 3.2, 2.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (st === 'fear') {
      // Panicking anime sweat drops
      for (let i = 0; i < 2; i++) {
        const dropOff = ((t * 28 + i * 12) % 14);
        const dx = 18 - i * 16;
        const dy = (i === 0 ? -31 : 31) + (i === 0 ? -dropOff * 0.35 : dropOff * 0.35);
        ctx.fillStyle = '#7CE8FF';
        ctx.strokeStyle = '#140B1C';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(dx, dy - 5);
        ctx.quadraticCurveTo(dx + 4, dy + 1, dx, dy + 4.5);
        ctx.quadraticCurveTo(dx - 4, dy + 1, dx, dy - 5);
        ctx.fill();
        ctx.stroke();
      }
    } else if (st === 'stress') {
      // Twitching anime anger/stress vein mark
      const pulse = 1 + Math.sin(t * 24) * 0.16;
      ctx.save();
      ctx.translate(22, -26);
      ctx.scale(pulse, pulse);
      ctx.strokeStyle = '#FF2A4B';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.save();
        ctx.rotate((q * Math.PI) / 2);
        ctx.beginPath();
        ctx.moveTo(2, 2);
        ctx.quadraticCurveTo(3.5, 5.5, 7, 5);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    } else if (st === 'sad') {
      // Sulking teardrop near eye
      const drop = (t * 10) % 9;
      ctx.fillStyle = '#76D8FF';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(20, 21 + drop * 0.4);
      ctx.quadraticCurveTo(23.5, 25 + drop * 0.4, 20, 28 + drop * 0.4);
      ctx.quadraticCurveTo(16.5, 25 + drop * 0.4, 20, 21 + drop * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainStonefish;
