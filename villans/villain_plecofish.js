/**
 * Villain Bristlenose Pleco (Ancistrus — Obsidian Ember-Armored Tank Variant)
 * 2D Top-Down Expressive Chibi Villain Fish
 * Obsidian-armored tank body, glowing ember spots, wicked spiky snout tentacles, towering tattered bat-sail dorsal fin.
 */

const OUTLINE = '#140B1C';
const ONE_SHOT_STATES = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED_STATES = new Set(['shock', 'fear']);
const BLOCKED_WHEN_LOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);

const STATE_ALIASES = {
  idle: 'breathing',
  hunger: 'hungry',
};

const VALID_STATES = new Set([
  'breathing',
  'swimming',
  'relax',
  'left_turn',
  'right_turn',
  'eating',
  'hungry',
  'stress',
  'fear',
  'shock',
  'happy',
  'sad',
]);

const POSE_TARGETS = {
  breathing:  { bend: 0,     pectoral: 0.15, sail: 0.25, bristle: 0.1,  wagFreq: 1.8,  wagAmp: 0.08, ember: 0.45 },
  swimming:   { bend: 0,     pectoral: 0.55, sail: 0.55, bristle: 0.25, wagFreq: 6.0,  wagAmp: 0.26, ember: 0.65 },
  relax:      { bend: 0.04,  pectoral: 0.05, sail: 0.10, bristle: 0.0,  wagFreq: 1.1,  wagAmp: 0.04, ember: 0.25 },
  left_turn:  { bend: -0.52, pectoral: 0.80, sail: 0.72, bristle: 0.35, wagFreq: 4.5,  wagAmp: 0.18, ember: 0.70 },
  right_turn: { bend: 0.52,  pectoral: 0.80, sail: 0.72, bristle: 0.35, wagFreq: 4.5,  wagAmp: 0.18, ember: 0.70 },
  eating:     { bend: 0,     pectoral: 0.75, sail: 0.85, bristle: 0.90, wagFreq: 7.5,  wagAmp: 0.16, ember: 0.95 },
  hungry:     { bend: 0,     pectoral: 0.50, sail: 0.80, bristle: 0.75, wagFreq: 5.2,  wagAmp: 0.18, ember: 0.90 },
  stress:     { bend: 0,     pectoral: 0.70, sail: 0.95, bristle: 0.65, wagFreq: 13.0, wagAmp: 0.12, ember: 0.85 },
  fear:       { bend: 0,     pectoral: 0.90, sail: 0.15, bristle: -0.2, wagFreq: 15.0, wagAmp: 0.14, ember: 0.30 },
  shock:      { bend: 0,     pectoral: 1.0,  sail: 1.0,  bristle: 1.0,  wagFreq: 17.0, wagAmp: 0.10, ember: 1.0  },
  happy:      { bend: 0,     pectoral: 0.45, sail: 0.70, bristle: 0.45, wagFreq: 4.2,  wagAmp: 0.18, ember: 0.80 },
  sad:        { bend: -0.05, pectoral: -0.1, sail: 0.05, bristle: -0.25, wagFreq: 1.0, wagAmp: 0.04, ember: 0.18 },
};

const ONE_SHOT_DURATIONS = {
  left_turn: 0.65,
  right_turn: 0.65,
  eating: 0.58,
  shock: 0.74,
};

function easeCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class VillainPlecofish {
  static metadata = {
    name: 'Villain Bristlenose Pleco',
    category: 'villain_fish',
    baseLength: 85,
    baseWidth: 48,
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

    this._blendDuration = 0.15;
    this._blendElapsed = 0.15;
    this._fromPose = { ...POSE_TARGETS.breathing };
    this._pose = { ...POSE_TARGETS.breathing };
    this._callbacks = new Map();
  }

  setAngle(radians) {
    this.angle = radians;
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
    if (typeof callback !== 'function') return;
    const normalized = STATE_ALIASES[name] || name;
    if (!this._callbacks.has(normalized)) {
      this._callbacks.set(normalized, []);
    }
    this._callbacks.get(normalized).push(callback);
  }

  play(name) {
    const target = STATE_ALIASES[name] || name;
    if (!VALID_STATES.has(target)) return false;

    if (LOCKED_STATES.has(this._state) && BLOCKED_WHEN_LOCKED.has(target)) {
      return false;
    }

    if (target === this._state && !ONE_SHOT_STATES.has(target)) {
      return true;
    }

    if (!ONE_SHOT_STATES.has(this._state)) {
      this._prevState = this._state;
    }

    this._fromPose = { ...this._pose };
    this._state = target;
    this._stateTime = 0;
    this._blendElapsed = 0;
    return true;
  }

  update(dt) {
    const step = Math.max(0, Math.min(dt || 0, 0.1));
    this._time += step;
    this._stateTime += step;

    if (this._blendElapsed < this._blendDuration) {
      this._blendElapsed = Math.min(this._blendDuration, this._blendElapsed + step);
      const t = easeCubic(this._blendElapsed / this._blendDuration);
      const target = POSE_TARGETS[this._state];
      for (const key of Object.keys(this._pose)) {
        this._pose[key] = lerp(this._fromPose[key], target[key], t);
      }
    } else {
      const target = POSE_TARGETS[this._state];
      for (const key of Object.keys(this._pose)) {
        this._pose[key] = target[key];
      }
    }

    if (ONE_SHOT_STATES.has(this._state)) {
      const dur = ONE_SHOT_DURATIONS[this._state];
      if (this._stateTime >= dur) {
        const finished = this._state;
        const returnTo = this._prevState || 'breathing';
        this._fromPose = { ...this._pose };
        this._state = returnTo;
        this._stateTime = 0;
        this._blendElapsed = 0;

        const list = this._callbacks.get(finished);
        if (list && list.length) {
          for (const cb of [...list]) cb(finished);
        }
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    const t = this._time;
    const p = this._pose;
    const st = this._state;

    if (st === 'stress' || st === 'fear' || st === 'shock') {
      const mag = st === 'shock' ? 1.5 : 0.7;
      ctx.translate(Math.sin(t * 54) * mag, Math.cos(t * 62) * mag);
    }

    const wag = Math.sin(t * p.wagFreq) * p.wagAmp;
    const bend = p.bend + wag;

    // 1. Dark Miasma Tank Shadow
    this._drawMiasma(ctx, t, p.ember);

    // 2. Spiky Armored Tail Fin
    this._drawArmoredTail(ctx, bend, p.ember, t);

    // 3. Broad Wing-Like Spiked Pectoral & Pelvic Fins
    this._drawTankFins(ctx, p.pectoral, wag, p.ember);

    // 4. Wicked Spiky Snout Tentacles (Bristles)
    this._drawSnoutBristles(ctx, p.bristle, p.ember, t);

    // 5. Obsidian Armored Tank Body + Glowing Ember Spots + Cracked Scutes
    this._drawArmoredBody(ctx, bend, p.ember, t);

    // 6. Towering Tattered Bat-Sail Dorsal Fin
    this._drawBatSail(ctx, bend, p.sail, p.ember, t);

    // 7. Expressive Villain Chibi Eyes
    this._drawEyes(ctx, st, t);

    // 8. Mood FX & Snapping Fangs
    this._drawMoodFX(ctx, st, t);

    ctx.restore();
  }

  _drawMiasma(ctx, t, ember) {
    ctx.save();
    const rx = 44 + Math.sin(t * 2.8) * 2.2;
    const ry = 26 + ember * 3;
    const grad = ctx.createRadialGradient(2, 0, 10, 0, 0, rx);
    grad.addColorStop(0, 'rgba(18, 8, 28, 0.58)');
    grad.addColorStop(0.6, `rgba(180, 42, 18, ${0.14 + ember * 0.14})`);
    grad.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawArmoredTail(ctx, bend, ember, t) {
    ctx.save();
    ctx.translate(-29, bend * 6);
    ctx.rotate(bend * 0.65);

    const g = ctx.createLinearGradient(0, 0, -16, 0);
    g.addColorStop(0, '#22182C');
    g.addColorStop(0.65, '#3E2336');
    g.addColorStop(1, '#A6212C');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(2, -4.5);
    ctx.lineTo(-14, -14.5);
    ctx.lineTo(-11, -7.5);
    ctx.lineTo(-14.5, -4.0); // tattered notch
    ctx.lineTo(-9.5, 0);
    ctx.lineTo(-14.5, 5.5);
    ctx.lineTo(-11.5, 9.5);
    ctx.lineTo(-15.5, 14.5);
    ctx.lineTo(2, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ember glow dots on tail lobes
    ctx.fillStyle = `rgba(255, 110, 30, ${0.5 + ember * 0.45 * Math.abs(Math.sin(t * 4))})`;
    ctx.beginPath();
    ctx.arc(-8, -7, 1.4, 0, Math.PI * 2);
    ctx.arc(-8, 7, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawTankFins(ctx, flare, wag, ember) {
    const drawPec = (side) => {
      ctx.save();
      ctx.translate(10, side * 15);
      ctx.rotate(side * (0.28 + flare * 0.35) + wag * 0.2);

      const g = ctx.createLinearGradient(4, 0, -14, side * 16);
      g.addColorStop(0, '#23192D');
      g.addColorStop(0.65, '#37233D');
      g.addColorStop(1, '#7D1D2B');

      ctx.fillStyle = g;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';

      // Broad armored spiked pectoral fin
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.quadraticCurveTo(3, side * 14, -10, side * 17);
      ctx.lineTo(-9, side * 12);
      ctx.lineTo(-14, side * 10); // battle notch
      ctx.lineTo(-10, side * 5);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Leading bone spine highlight
      ctx.strokeStyle = '#FF6A2B';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(6, side * 1.5);
      ctx.quadraticCurveTo(1, side * 11, -8.5, side * 15);
      ctx.stroke();

      // Ember spots
      ctx.fillStyle = `rgba(255, 125, 38, ${0.45 + ember * 0.4})`;
      ctx.beginPath();
      ctx.arc(-2, side * 8, 1.5, 0, Math.PI * 2);
      ctx.arc(-6, side * 11, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawPelvic = (side) => {
      ctx.save();
      ctx.translate(-12, side * 11.5);
      ctx.rotate(side * (0.35 + flare * 0.25) + wag * 0.3);
      ctx.fillStyle = '#2A1D35';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(-8, side * 10);
      ctx.lineTo(-10, side * 5);
      ctx.lineTo(-4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    drawPec(-1);
    drawPec(1);
    drawPelvic(-1);
    drawPelvic(1);
  }

  _drawSnoutBristles(ctx, bristle, ember, t) {
    ctx.save();
    const wiggle = Math.sin(t * 9) * 0.6;
    const angles = [-0.72, -0.45, -0.2, 0, 0.2, 0.45, 0.72];

    for (let i = 0; i < angles.length; i++) {
      const a = angles[i];
      const len = (i === 3 ? 11.5 : (i === 2 || i === 4 ? 10.5 : 8.5)) + bristle * 3.0;
      const sx = 32 + Math.cos(a) * 4;
      const sy = Math.sin(a) * 10.5;
      const ex = sx + Math.cos(a) * len;
      const ey = sy + Math.sin(a) * (len * 0.9) + (i % 2 === 0 ? wiggle : -wiggle);

      // Spiky branched tentacle
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      ctx.strokeStyle = i % 2 === 0 ? '#FF5E24' : '#B8253A';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * 3, sy + Math.sin(a) * 2.5);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Tiny glowing ember barb tip
      ctx.fillStyle = `rgba(255, 165, 60, ${0.55 + ember * 0.4})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 1.15, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawArmoredBody(ctx, bend, ember, t) {
    ctx.save();

    const buildHull = () => {
      ctx.beginPath();
      // Wide blunt armored tank head tapering into armored tail
      ctx.moveTo(35, 0);
      ctx.bezierCurveTo(35, -13.5, 22, -20.5, 6, -18.5);
      ctx.bezierCurveTo(-8, -16.8, -19, -9.8 + bend * 3.5, -30, -4.5 + bend * 6);
      ctx.lineTo(-30, 4.5 + bend * 6);
      ctx.bezierCurveTo(-19, 9.8 + bend * 3.5, -8, 16.8, 6, 18.5);
      ctx.bezierCurveTo(22, 20.5, 35, 13.5, 35, 0);
      ctx.closePath();
    };

    const g = ctx.createLinearGradient(34, -18, -28, 18);
    g.addColorStop(0, '#30253D');
    g.addColorStop(0.45, '#1F172B');
    g.addColorStop(1, '#120C1A');

    buildHull();
    ctx.fillStyle = g;
    ctx.fill();

    // Clip armor plates, ember spots, cracks, and glossy highlight
    ctx.save();
    buildHull();
    ctx.clip();

    // Overlapping armored scute chevrons
    ctx.strokeStyle = 'rgba(85, 64, 112, 0.55)';
    ctx.lineWidth = 1.5;
    for (let x = 14; x >= -22; x -= 8) {
      ctx.beginPath();
      ctx.moveTo(x + 4, -18);
      ctx.lineTo(x, 0 + (x < 0 ? bend * 2 : 0));
      ctx.lineTo(x + 4, 18);
      ctx.stroke();
    }

    // Cracked magma-ember armor fissure on forehead
    const pulse = 0.65 + 0.35 * Math.sin(t * 4.2);
    ctx.strokeStyle = `rgba(255, 92, 28, ${pulse * (0.55 + ember * 0.45)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(27, -2);
    ctx.lineTo(22, -5.5);
    ctx.lineTo(17, -2.5);
    ctx.lineTo(12, -6);
    ctx.stroke();

    // Glowing ember spots across obsidian armor
    const spots = [
      [25, -9, 1.8], [25, 9, 1.8], [16, -13, 2.0], [16, 13, 2.0],
      [6, -12, 2.1], [6, 12, 2.1], [-4, -10, 1.8], [-4, 10, 1.8],
      [-14, -7.5, 1.5], [-14, 7.5, 1.5], [-22, -4.5, 1.2], [-22, 4.5, 1.2],
    ];
    for (const [sx, sy, sr] of spots) {
      ctx.fillStyle = `rgba(255, 105, 25, ${0.25 + ember * 0.35})`;
      ctx.beginPath();
      ctx.arc(sx, sy + (sx < -6 ? bend * 2.5 : 0), sr * 1.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 186, 66, ${0.65 + ember * 0.35})`;
      ctx.beginPath();
      ctx.arc(sx, sy + (sx < -6 ? bend * 2.5 : 0), sr * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cel-shade lower half
    ctx.fillStyle = 'rgba(10, 4, 18, 0.35)';
    ctx.fillRect(-35, 3, 75, 20);

    // Glossy obsidian armor specular
    ctx.fillStyle = 'rgba(185, 160, 230, 0.16)';
    ctx.beginPath();
    ctx.ellipse(14, -9, 12, 3.6, -0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Bold outline
    buildHull();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.restore();
  }

  _drawBatSail(ctx, bend, sail, ember, t) {
    ctx.save();
    const sway = Math.sin(t * 4.5) * 1.2 + bend * 4.0;
    const width = 4.2 + sail * 4.8;

    // Towering tattered bat-sail dorsal fin viewed from top-down (sweeping off spine)
    const g = ctx.createLinearGradient(8, -width, -18, width);
    g.addColorStop(0, '#3D132B');
    g.addColorStop(0.55, '#8E172E');
    g.addColorStop(1, '#E03B24');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(11, 0);
    ctx.quadraticCurveTo(4, -width * 0.9 + sway * 0.3, -2, -width + sway * 0.5);
    ctx.lineTo(-5, -width * 0.45 + sway * 0.6); // bat-wing scallop
    ctx.lineTo(-10, -width * 0.85 + sway * 0.8);
    ctx.lineTo(-14, -width * 0.35 + sway * 0.9);
    ctx.lineTo(-20, sway);
    ctx.lineTo(-12, 3.2 + sway * 0.7);
    ctx.lineTo(2, 2.8 + sway * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing bat-sail ribs
    ctx.strokeStyle = `rgba(255, 130, 48, ${0.4 + ember * 0.4})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(5, 0); ctx.lineTo(-1.5, -width * 0.85 + sway * 0.5);
    ctx.moveTo(-2, 0.5); ctx.lineTo(-9.5, -width * 0.72 + sway * 0.75);
    ctx.stroke();
    ctx.restore();
  }

  _drawEyes(ctx, st, t) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(22, side * 10.2);

      if (st === 'stress') {
        ctx.strokeStyle = '#FF5526';
        ctx.lineWidth = 2.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.8, side * -2.4);
        ctx.lineTo(2.0, 0);
        ctx.lineTo(-2.8, side * 2.4);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const r = st === 'shock' ? 4.6 : 3.7;
      ctx.fillStyle = st === 'shock' ? '#FFF6EA' : '#1E0D26';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (st === 'shock') {
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.arc(0.6, 0, 1.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = st === 'hungry' ? '#FF261B' : '#FF8C1A';
        ctx.beginPath();
        ctx.arc(0.4, 0, r * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Omega-style slit pupil
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(0.6, 0, 0.85, r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dual catchlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(1.4, -1.0, 0.95, 0, Math.PI * 2);
        ctx.arc(-0.6, 1.1, 0.5, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'relax' || st === 'happy') {
          ctx.fillStyle = '#1F172B';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.2, Math.PI * 0.95, Math.PI * 2.05);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Armored V-brow ridge
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(-3.2, side * 4.2);
        ctx.lineTo(3.4, side * 2.3);
      } else {
        ctx.moveTo(-3.2, side * 2.2);
        ctx.lineTo(3.6, side * 4.6);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodFX(ctx, st, t) {
    ctx.save();
    if (st === 'eating' || st === 'hungry') {
      const snap = Math.abs(Math.sin(t * 20));
      ctx.fillStyle = '#FFF5E6';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(33, side * (4.2 + snap * 1.2));
        ctx.lineTo(38 + snap * 1.5, side * 2.2);
        ctx.lineTo(33, side * 1.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    if (st === 'happy') {
      for (let i = 0; i < 3; i++) {
        const a = t * 2.6 + i * 2.09;
        const sx = 12 + Math.cos(a) * 20;
        const sy = Math.sin(a) * 20;
        const s = 2.5 + Math.sin(t * 7 + i) * 0.8;
        ctx.fillStyle = i % 2 === 0 ? '#FF4D2E' : '#B347FF';
        ctx.beginPath();
        ctx.moveTo(sx, sy - s);
        ctx.lineTo(sx + s * 0.35, sy - s * 0.35);
        ctx.lineTo(sx + s, sy);
        ctx.lineTo(sx + s * 0.35, sy + s * 0.35);
        ctx.lineTo(sx, sy + s);
        ctx.lineTo(sx - s * 0.35, sy + s * 0.35);
        ctx.lineTo(sx - s, sy);
        ctx.lineTo(sx - s * 0.35, sy - s * 0.35);
        ctx.closePath();
        ctx.fill();
      }
    } else if (st === 'shock') {
      const b = Math.abs(Math.sin(t * 15)) * 2.5;
      ctx.fillStyle = '#FF3838';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.roundRect(24, -26 - b, 3.6, 9, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(25.8, -14 - b, 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'fear') {
      const drop = (t * 18) % 10;
      ctx.fillStyle = '#7CE8FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(16, -22 - drop * 0.3);
      ctx.quadraticCurveTo(20, -17.5, 16, -16);
      ctx.quadraticCurveTo(12, -17.5, 16, -22 - drop * 0.3);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'stress') {
      const sc = 1 + Math.sin(t * 24) * 0.16;
      ctx.save();
      ctx.translate(15, -18);
      ctx.scale(sc, sc);
      ctx.strokeStyle = '#FF2A4B';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(1.3, 1.3);
        ctx.quadraticCurveTo(2.6, 2.6, 4.5, 1.5);
        ctx.stroke();
      }
      ctx.restore();
    } else if (st === 'sad') {
      const fall = (t * 7) % 6;
      ctx.fillStyle = '#60C5FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(22, 14 + fall * 0.4);
      ctx.quadraticCurveTo(24.5, 17 + fall * 0.4, 22, 18.5 + fall * 0.4);
      ctx.quadraticCurveTo(19.5, 17 + fall * 0.4, 22, 14 + fall * 0.4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

export default VillainPlecofish;
