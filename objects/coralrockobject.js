/**
 * Craggy Sea Boulder Cluster (Top-Down Expressive Chibi Static Prop)
 * Native HTML5 Canvas 2D API — Zero External Dependencies
 */

const OUTLINE = '#1E142B';

export class Coralrockobject {
  static metadata = {
    name: 'Craggy Sea Boulder Cluster',
    category: 'object',
    baseLength: 140,
    baseWidth: 125,
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
    this._drawSatelliteRocks(ctx);
    this._drawPrimaryBoulder(ctx);
    this._drawSecondaryBoulder(ctx);
    this._drawMossPatches(ctx);
    this._drawBarnacles(ctx);
    this._drawChibiStarfish(ctx, -20, -14, 12.5, -0.35, '#FF7D59', '#D9432B', '#FFC29E');
    this._drawChibiStarfish(ctx, 27, 22, 9.5, 0.55, '#FF6FA8', '#C92C72', '#FFC2DF');

    ctx.restore();
  }

  _drawAmbientShadow(ctx) {
    const grad = ctx.createRadialGradient(0, 6, 14, 0, 6, 68);
    grad.addColorStop(0, 'rgba(10, 20, 38, 0.56)');
    grad.addColorStop(0.68, 'rgba(10, 20, 38, 0.24)');
    grad.addColorStop(1, 'rgba(10, 20, 38, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(2, 6, 66, 58, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawRockPolygon(ctx, pts, cTop, cMid, cDark, facetPts, crackLines) {
    ctx.save();
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();

    // Compute rough bounds for gradient
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of pts) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }

    const grad = ctx.createLinearGradient(minX, minY, maxX, maxY);
    grad.addColorStop(0, cTop);
    grad.addColorStop(0.5, cMid);
    grad.addColorStop(1, cDark);
    ctx.fillStyle = grad;
    ctx.fill();

    // Top faceted cel-shaded plateau
    if (facetPts) {
      ctx.fillStyle = 'rgba(210, 225, 240, 0.24)';
      ctx.beginPath();
      facetPts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.closePath();
      ctx.fill();
    }

    // Deep crevices & ridge lines
    if (crackLines) {
      ctx.strokeStyle = 'rgba(26, 20, 42, 0.6)';
      ctx.lineWidth = 1.8;
      for (const line of crackLines) {
        ctx.beginPath();
        line.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
        ctx.stroke();
      }
    }

    // Bold dark-espresso outline
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.stroke();
    ctx.restore();
  }

  _drawSatelliteRocks(ctx) {
    // Lower-left satellite crag
    this._drawRockPolygon(
      ctx,
      [
        [-58, 12], [-44, 2], [-22, 8], [-18, 30], [-34, 44], [-56, 36],
      ],
      '#8494A6',
      '#5C6A7D',
      '#3D4859',
      [[-50, 14], [-40, 8], [-27, 13], [-32, 26], [-47, 24]],
      [[[-40, 8], [-36, 22], [-24, 28]]]
    );

    // Upper-right smaller reef stone
    this._drawRockPolygon(
      ctx,
      [
        [18, -48], [40, -45], [56, -28], [46, -10], [22, -14], [10, -32],
      ],
      '#8C9CAD',
      '#617082',
      '#424E5E',
      [[22, -42], [38, -39], [46, -28], [34, -22], [19, -31]],
      [[[38, -39], [34, -22], [44, -13]]]
    );

    // Tiny loose seabed pebbles
    const pebbles = [
      [-60, -14, 6, 4.5, 0.3],
      [58, 6, 7, 5, -0.4],
      [-8, 52, 6.5, 4.5, 0.1],
    ];
    for (const [x, y, rx, ry, rot] of pebbles) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = '#6B7A8C';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawPrimaryBoulder(ctx) {
    // Large central craggy slate-grey boulder
    this._drawRockPolygon(
      ctx,
      [
        [-44, -24], [-22, -48], [14, -44], [30, -18],
        [24, 18], [-4, 34], [-34, 22], [-48, -2],
      ],
      '#9AAABC',
      '#6E7D91',
      '#465263',
      [[-32, -20], [-16, -38], [8, -34], [16, -14], [6, 8], [-22, 4]],
      [
        [[-16, -38], [-12, -16], [-32, -20]],
        [[8, -34], [6, 8], [22, 14]],
        [[-12, -16], [6, 8], [-4, 30]],
      ]
    );

    // Crisp rim highlight on upper-left crag edge
    ctx.strokeStyle = 'rgba(225, 238, 252, 0.55)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-36, -18);
    ctx.lineTo(-19, -40);
    ctx.lineTo(8, -37);
    ctx.stroke();
  }

  _drawSecondaryBoulder(ctx) {
    // Overlapping lower-right boulder
    this._drawRockPolygon(
      ctx,
      [
        [6, 4], [32, -6], [56, 12], [52, 38], [26, 50], [2, 36],
      ],
      '#8F9FB2',
      '#647387',
      '#3E4959',
      [[14, 10], [31, 3], [46, 16], [36, 32], [16, 26]],
      [
        [[31, 3], [32, 22], [49, 34]],
        [[16, 26], [26, 46]],
      ]
    );
  }

  _drawMossPatches(ctx) {
    // Lush velvety seabed moss cushions tucked into rock crevices
    const patches = [
      { x: 10, y: -24, rx: 14, ry: 8, rot: 0.4 },
      { x: -34, y: 24, rx: 13, ry: 7.5, rot: -0.35 },
      { x: 40, y: -26, rx: 10, ry: 6, rot: 0.2 },
      { x: 14, y: 36, rx: 11, ry: 6.5, rot: 0.5 },
    ];
    for (const m of patches) {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.rot);
      const grad = ctx.createRadialGradient(-2, -2, 1, 0, 0, m.rx);
      grad.addColorStop(0, '#7FD472');
      grad.addColorStop(0.6, '#489E4F');
      grad.addColorStop(1, '#2B693B');
      ctx.fillStyle = grad;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, m.rx, m.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tiny moss tuft dots
      ctx.fillStyle = '#B2F09C';
      ctx.beginPath();
      ctx.arc(-m.rx * 0.3, -m.ry * 0.2, 1.8, 0, Math.PI * 2);
      ctx.arc(m.rx * 0.15, -m.ry * 0.3, 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawBarnacles(ctx) {
    const clusters = [
      [-10, 18, 4.4], [-4, 22, 3.2], [-15, 22, 2.8],
      [20, -4, 3.8], [25, -8, 3.0], [16, -8, 2.5],
      [44, 16, 4.0], [49, 20, 2.9],
      [-42, -6, 3.6], [-46, -1, 2.7],
    ];
    for (const [bx, by, r] of clusters) {
      ctx.fillStyle = '#E5DAC4';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#4B3E4D';
      ctx.beginPath();
      ctx.arc(bx, by, r * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawChibiStarfish(ctx, x, y, r, rot, cLight, cDark, cDot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    // Shadow beneath starfish
    ctx.fillStyle = 'rgba(18, 12, 30, 0.34)';
    ctx.beginPath();
    ctx.arc(1.5, 2, r * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Chunky rounded 5-arm chibi starfish silhouette
    const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 1, 0, 0, r);
    grad.addColorStop(0, cLight);
    grad.addColorStop(1, cDark);

    ctx.fillStyle = grad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const aTip = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const aMid1 = aTip - Math.PI / 5;
      const aMid2 = aTip + Math.PI / 5;
      const vx1 = Math.cos(aMid1) * (r * 0.44);
      const vy1 = Math.sin(aMid1) * (r * 0.44);
      const tx = Math.cos(aTip) * r;
      const ty = Math.sin(aTip) * r;
      const vx2 = Math.cos(aMid2) * (r * 0.44);
      const vy2 = Math.sin(aMid2) * (r * 0.44);
      if (i === 0) ctx.moveTo(vx1, vy1);
      ctx.quadraticCurveTo(tx, ty, vx2, vy2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cute pale ridge dots along starfish arms
    ctx.fillStyle = cDot;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export default Coralrockobject;
