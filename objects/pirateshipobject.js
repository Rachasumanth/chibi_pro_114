/**
 * Sunken Pirate Galleon Wreck (Top-Down Expressive Chibi Static Prop)
 * Native HTML5 Canvas 2D API — Zero External Dependencies
 */

const OUTLINE = '#1E142B';

export class Pirateshipobject {
  static metadata = {
    name: 'Sunken Pirate Galleon Wreck',
    category: 'object',
    baseLength: 260,
    baseWidth: 115,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
  }

  play(name) {}
  update(dt) {}

  setAngle(radians) {
    this.angle = radians;
  }

  setDirection(dx, dy) {
    if (dx !== 0 || dy !== 0) {
      this.angle = Math.atan2(dy, dx);
    }
  }

  getState() {
    return 'static';
  }

  onFinished(name, callback) {}

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    this._drawAmbientShadow(ctx);
    this._drawBowsprit(ctx);
    this._drawCannonPorts(ctx);
    this._drawOuterHull(ctx);
    this._drawMainDeck(ctx);
    this._drawCargoGrate(ctx);
    this._drawForecastle(ctx);
    this._drawQuarterdeck(ctx);
    this._drawCoiledRopes(ctx);
    this._drawBrokenMasts(ctx);
    this._drawTatteredFlag(ctx);
    this._drawBarnacleClusters(ctx);
    this._drawHighlightsAndGlints(ctx);

    ctx.restore();
  }

  _hullPath(ctx, inset = 0) {
    const bowX = 114 - inset;
    const sternX = -114 + inset;
    const halfW = 47 - inset;
    const sternW = 34 - inset * 0.7;

    ctx.beginPath();
    ctx.moveTo(bowX, 0);
    ctx.bezierCurveTo(bowX - 18, -halfW * 0.88, 42, -halfW, -16, -halfW);
    ctx.bezierCurveTo(-68, -halfW, -96, -sternW - 6, sternX, -sternW);
    ctx.quadraticCurveTo(sternX - 6, 0, sternX, sternW);
    ctx.bezierCurveTo(-96, sternW + 6, -68, halfW, -16, halfW);
    ctx.bezierCurveTo(42, halfW, bowX - 18, halfW * 0.88, bowX, 0);
    ctx.closePath();
  }

  _drawAmbientShadow(ctx) {
    ctx.save();
    // Deep seabed ambient occlusion
    const grad = ctx.createRadialGradient(0, 6, 12, 0, 6, 134);
    grad.addColorStop(0, 'rgba(12, 22, 42, 0.56)');
    grad.addColorStop(0.65, 'rgba(12, 22, 42, 0.28)');
    grad.addColorStop(1, 'rgba(12, 22, 42, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(2, 6, 130, 56, 0, 0, Math.PI * 2);
    ctx.fill();

    // Soft sand drift around hull keel
    ctx.fillStyle = 'rgba(218, 192, 140, 0.22)';
    ctx.beginPath();
    ctx.ellipse(-45, 36, 52, 16, -0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(42, -35, 44, 14, 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawBowsprit(ctx) {
    ctx.save();
    // Broken chunky bowsprit jutting forward
    const grad = ctx.createLinearGradient(96, -7, 96, 7);
    grad.addColorStop(0, '#9E683B');
    grad.addColorStop(0.45, '#7A4A26');
    grad.addColorStop(1, '#4C2B14');

    ctx.fillStyle = grad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(92, -6.5);
    ctx.lineTo(123, -3.8);
    ctx.lineTo(127, -1.5);
    ctx.lineTo(122, 0.8);
    ctx.lineTo(126, 3.2);
    ctx.lineTo(92, 6.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Iron lashing bands around bowsprit
    ctx.fillStyle = '#4B5568';
    for (const bx of [102, 113]) {
      ctx.beginPath();
      ctx.rect(bx, -5.2, 4.2, 10.4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawCannonPorts(ctx) {
    ctx.save();
    const xs = [-44, -12, 20, 50];
    for (const side of [-1, 1]) {
      for (const x of xs) {
        const y = side * 46.5;
        // Protruding stubby dark cannon muzzle
        ctx.fillStyle = '#333C4D';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.rect(x - 4.5, y + (side > 0 ? -3 : -5), 9, 8);
        ctx.fill();
        ctx.stroke();

        // Muzzle ring
        ctx.fillStyle = '#536076';
        ctx.beginPath();
        ctx.rect(x - 5.2, y + (side > 0 ? 3.5 : -6.5), 10.4, 3);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _drawOuterHull(ctx) {
    ctx.save();
    // Thick chunky outer timber bulwark
    const rimGrad = ctx.createLinearGradient(0, -48, 0, 48);
    rimGrad.addColorStop(0, '#A56A3C');
    rimGrad.addColorStop(0.28, '#7E4B26');
    rimGrad.addColorStop(0.72, '#5F3519');
    rimGrad.addColorStop(1, '#44230F');

    this._hullPath(ctx, 0);
    ctx.fillStyle = rimGrad;
    ctx.fill();
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    // Top-edge bulwark bevel highlight
    ctx.save();
    this._hullPath(ctx, 2.5);
    ctx.strokeStyle = 'rgba(255, 214, 155, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Gunwale rib posts along sides
    ctx.fillStyle = '#6E3F1E';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    const ribXs = [-82, -58, -32, -6, 20, 46, 70];
    for (const rx of ribXs) {
      const yOff = Math.abs(rx) > 65 ? 36 : 41.5;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.rect(rx - 3, s * yOff - 2.5, 6, 5);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _drawMainDeck(ctx) {
    ctx.save();
    this._hullPath(ctx, 7.5);
    const deckGrad = ctx.createLinearGradient(-105, -40, 100, 40);
    deckGrad.addColorStop(0, '#9B6B3F');
    deckGrad.addColorStop(0.45, '#BA8552');
    deckGrad.addColorStop(0.85, '#926036');
    deckGrad.addColorStop(1, '#734824');
    ctx.fillStyle = deckGrad;
    ctx.fill();

    // Clip to deck for individual planks, seams, wood grain & nails
    ctx.save();
    ctx.clip();

    const plankH = 8.5;
    for (let y = -42, row = 0; y <= 42; y += plankH, row++) {
      // Subtle alternating plank tint
      ctx.fillStyle = row % 2 === 0 ? 'rgba(255, 224, 178, 0.09)' : 'rgba(42, 22, 10, 0.1)';
      ctx.fillRect(-115, y, 230, plankH);

      // Horizontal plank seam
      ctx.strokeStyle = 'rgba(30, 20, 43, 0.55)';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(-115, y);
      ctx.lineTo(115, y);
      ctx.stroke();

      // Staggered butt joints & nail heads
      const offset = (row % 3) * 24 - 92;
      for (let jx = offset; jx < 105; jx += 54) {
        ctx.beginPath();
        ctx.moveTo(jx, y);
        ctx.lineTo(jx, y + plankH);
        ctx.stroke();

        // Twin nail heads flanking butt joint
        ctx.fillStyle = '#2B1D2E';
        for (const nx of [jx - 3.2, jx + 3.2]) {
          ctx.beginPath();
          ctx.arc(nx, y + 2.4, 1.15, 0, Math.PI * 2);
          ctx.arc(nx, y + plankH - 2.4, 1.15, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Cracked hull breach hole in mid-starboard deck
    ctx.fillStyle = '#191324';
    ctx.beginPath();
    ctx.moveTo(14, 18);
    ctx.lineTo(36, 15);
    ctx.lineTo(44, 24);
    ctx.lineTo(32, 34);
    ctx.lineTo(12, 30);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Jagged pale wood splinters poking into breach
    ctx.fillStyle = '#D7A56E';
    ctx.beginPath();
    ctx.moveTo(13, 21);
    ctx.lineTo(24, 23);
    ctx.lineTo(14, 26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(41, 21);
    ctx.lineTo(30, 26);
    ctx.lineTo(38, 29);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Algae & damp seabed moss stains on deck
    const mossSpots = [
      { x: -64, y: 20, rx: 18, ry: 9 },
      { x: 46, y: -24, rx: 16, ry: 8 },
      { x: -8, y: -28, rx: 14, ry: 6 },
    ];
    for (const m of mossSpots) {
      ctx.fillStyle = 'rgba(68, 128, 86, 0.34)';
      ctx.beginPath();
      ctx.ellipse(m.x, m.y, m.rx, m.ry, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Inner ambient shadow along bulwark edge
    this._hullPath(ctx, 7.5);
    ctx.strokeStyle = 'rgba(20, 12, 28, 0.45)';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.restore();

    // Crisp inner bulwark outline
    this._hullPath(ctx, 7.5);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
  }

  _drawCargoGrate(ctx) {
    ctx.save();
    const gx = -26;
    const gy = -15;
    const gw = 38;
    const gh = 30;

    // Drop shadow under grate frame
    ctx.fillStyle = 'rgba(20, 12, 28, 0.35)';
    ctx.fillRect(gx + 2, gy + 3, gw, gh);

    // Dark cargo hold pit
    ctx.fillStyle = '#1B1426';
    ctx.fillRect(gx, gy, gw, gh);

    // Wooden lattice bars
    ctx.fillStyle = '#8F5A30';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.4;
    for (let x = gx + 7; x < gx + gw - 3; x += 8) {
      ctx.fillRect(x, gy + 2, 3.2, gh - 4);
    }
    for (let y = gy + 6; y < gy + gh - 3; y += 7.5) {
      ctx.fillRect(gx + 2, y, gw - 4, 3.2);
    }

    // Chunky timber coaming frame
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#6E3E1D';
    ctx.strokeRect(gx, gy, gw, gh);
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = OUTLINE;
    ctx.strokeRect(gx - 2, gy - 2, gw + 4, gh + 4);
    ctx.strokeRect(gx + 2, gy + 2, gw - 4, gh - 4);

    // Corner iron brackets
    ctx.fillStyle = '#4B5568';
    for (const [cx, cy] of [
      [gx - 2, gy - 2],
      [gx + gw - 3, gy - 2],
      [gx - 2, gy + gh - 3],
      [gx + gw - 3, gy + gh - 3],
    ]) {
      ctx.fillRect(cx, cy, 5, 5);
      ctx.strokeRect(cx, cy, 5, 5);
    }
    ctx.restore();
  }

  _drawForecastle(ctx) {
    ctx.save();
    // Raised forward deck platform
    ctx.beginPath();
    ctx.moveTo(56, -34);
    ctx.bezierCurveTo(80, -30, 96, -15, 105, 0);
    ctx.bezierCurveTo(96, 15, 80, 30, 56, 34);
    ctx.closePath();

    const grad = ctx.createLinearGradient(56, -30, 105, 30);
    grad.addColorStop(0, '#C7925B');
    grad.addColorStop(0.55, '#A76F3E');
    grad.addColorStop(1, '#845229');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // Forecastle plank lines
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(30, 20, 43, 0.45)';
    ctx.lineWidth = 1.2;
    for (let y = -26; y <= 26; y += 8) {
      ctx.beginPath();
      ctx.moveTo(54, y);
      ctx.lineTo(106, y);
      ctx.stroke();
    }
    ctx.restore();

    // Chibi railing bar & balusters along aft edge of forecastle
    ctx.fillStyle = '#D59F65';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.fillRect(54, -34, 5.5, 68);
    ctx.strokeRect(54, -34, 5.5, 68);

    // Railing posts
    ctx.fillStyle = '#F2C585';
    for (const py of [-31, -15, 0, 15, 31]) {
      ctx.beginPath();
      ctx.arc(56.7, py, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawQuarterdeck(ctx) {
    ctx.save();
    // Raised stern quarterdeck
    ctx.beginPath();
    ctx.moveTo(-58, -38);
    ctx.bezierCurveTo(-82, -37, -100, -33, -107, -29);
    ctx.quadraticCurveTo(-112, 0, -107, 29);
    ctx.bezierCurveTo(-100, 33, -82, 37, -58, 38);
    ctx.closePath();

    const grad = ctx.createLinearGradient(-110, -35, -58, 35);
    grad.addColorStop(0, '#B9814C');
    grad.addColorStop(0.5, '#C9955E');
    grad.addColorStop(1, '#935F33');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // Quarterdeck planks
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(30, 20, 43, 0.45)';
    ctx.lineWidth = 1.2;
    for (let y = -30; y <= 30; y += 7.5) {
      ctx.beginPath();
      ctx.moveTo(-112, y);
      ctx.lineTo(-56, y);
      ctx.stroke();
    }
    ctx.restore();

    // Ornate golden stern trim bar
    ctx.fillStyle = '#E5B44B';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-104, -27);
    ctx.quadraticCurveTo(-109, 0, -104, 27);
    ctx.lineTo(-98, 25);
    ctx.quadraticCurveTo(-102, 0, -98, -25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Quarterdeck railing with central step gap
    ctx.fillStyle = '#D59F65';
    ctx.fillRect(-62, -38, 5.5, 27);
    ctx.strokeRect(-62, -38, 5.5, 27);
    ctx.fillRect(-62, 11, 5.5, 27);
    ctx.strokeRect(-62, 11, 5.5, 27);

    // Mini top-down ship's helm stand at stern
    ctx.fillStyle = '#6B3B1A';
    ctx.fillRect(-91, -6, 6, 12);
    ctx.strokeRect(-91, -6, 6, 12);
    ctx.fillStyle = '#E5B44B';
    ctx.beginPath();
    ctx.arc(-88, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  _drawCoiledRopes(ctx) {
    const drawCoil = (cx, cy, r) => {
      ctx.save();
      ctx.translate(cx, cy);
      // Shadow
      ctx.fillStyle = 'rgba(20, 12, 28, 0.35)';
      ctx.beginPath();
      ctx.arc(1.5, 2, r + 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Concentric braided rings
      for (let rad = r; rad >= 3; rad -= 3.2) {
        ctx.beginPath();
        ctx.arc(0, 0, rad, 0, Math.PI * 2);
        ctx.fillStyle = rad > r * 0.55 ? '#D8B376' : '#C39B5E';
        ctx.fill();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = OUTLINE;
        ctx.stroke();
      }
      ctx.restore();
    };

    drawCoil(70, -12, 8.5);
    drawCoil(-73, 21, 8);
  }

  _drawBrokenMasts(ctx) {
    const drawStump = (cx, cy, r) => {
      ctx.save();
      ctx.translate(cx, cy);

      // Cast shadow
      ctx.fillStyle = 'rgba(20, 12, 28, 0.42)';
      ctx.beginPath();
      ctx.ellipse(3, 4, r + 3, r + 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Outer bark / dark wood ring
      ctx.fillStyle = '#6B3E1F';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Jagged splintered pale interior heartwood
      ctx.fillStyle = '#E8BE82';
      ctx.beginPath();
      const spikes = 10;
      for (let i = 0; i < spikes; i++) {
        const a = (i / spikes) * Math.PI * 2;
        const rad = i % 2 === 0 ? r * 0.8 : r * 0.58;
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Growth rings
      ctx.strokeStyle = 'rgba(110, 62, 28, 0.55)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    // Mainmast stump (center-right) & foremast stump
    drawStump(26, -3, 11.5);
    drawStump(81, 0, 7.5);
  }

  _drawTatteredFlag(ctx) {
    ctx.save();
    // Fallen tattered Jolly Roger banner draped from mainmast toward port-aft
    ctx.translate(22, -6);
    ctx.rotate(-0.32);

    // Shadow beneath cloth
    ctx.fillStyle = 'rgba(18, 12, 28, 0.42)';
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.quadraticCurveTo(-24, -14, -52, -9);
    ctx.lineTo(-44, 0);
    ctx.lineTo(-55, 11);
    ctx.lineTo(-42, 16);
    ctx.lineTo(-49, 25);
    ctx.quadraticCurveTo(-22, 23, 0, 12);
    ctx.closePath();
    ctx.fill();

    // Tattered black pirate cloth
    const clothGrad = ctx.createLinearGradient(0, -14, -54, 24);
    clothGrad.addColorStop(0, '#343045');
    clothGrad.addColorStop(0.5, '#231F30');
    clothGrad.addColorStop(1, '#191524');

    ctx.fillStyle = clothGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-24, -15, -53, -11);
    ctx.lineTo(-45, -2);
    ctx.lineTo(-56, 8);
    ctx.lineTo(-43, 13);
    ctx.lineTo(-50, 22);
    ctx.quadraticCurveTo(-22, 20, 0, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Chibi skull & crossbones emblem on flag
    ctx.save();
    ctx.translate(-25, 5);
    ctx.strokeStyle = '#F5EFE0';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-9, -6);
    ctx.lineTo(9, 6);
    ctx.moveTo(9, -6);
    ctx.lineTo(-9, 6);
    ctx.stroke();

    // Cute rounded skull head
    ctx.fillStyle = '#F8F2E4';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, -1, 6.8, 5.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cute big eye sockets
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(-2.4, -1.2, 1.5, 0, Math.PI * 2);
    ctx.arc(2.4, -1.2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  _drawBarnacleClusters(ctx) {
    const drawBarnacle = (x, y, r) => {
      ctx.fillStyle = '#DED3BC';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#4B3E4D';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
      ctx.fill();
    };

    const clusters = [
      [94, 17, 4.2], [99, 13, 3.1], [91, 22, 2.8],
      [-98, -28, 4.4], [-92, -31, 3.0], [-102, -23, 2.7],
      [-40, 42, 4.0], [-34, 43, 3.2], [-45, 40, 2.6],
      [42, -40, 3.8], [47, -38, 2.9],
    ];
    for (const [bx, by, br] of clusters) {
      drawBarnacle(bx, by, br);
    }
  }

  _drawHighlightsAndGlints(ctx) {
    ctx.save();
    // Specular cel highlights on raised wood rails
    ctx.strokeStyle = 'rgba(255, 244, 214, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(57, -28);
    ctx.lineTo(57, -14);
    ctx.moveTo(-60, -34);
    ctx.lineTo(-60, -16);
    ctx.stroke();

    // Kawaii 4-point star glint on golden stern trim
    this._drawStarGlint(ctx, -104, -14, 5.5);
    ctx.restore();
  }

  _drawStarGlint(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#FFFDF2';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const r = i % 2 === 0 ? size : size * 0.28;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export default Pirateshipobject;
