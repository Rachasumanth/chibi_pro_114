/**
 * Wooden Dinghy Rowboat (Top-Down Expressive Chibi Static Prop)
 * Native HTML5 Canvas 2D API — Zero External Dependencies
 */

const OUTLINE = '#1E142B';

export class Rowboatobject {
  static metadata = {
    name: 'Wooden Dinghy Rowboat',
    category: 'object',
    baseLength: 145,
    baseWidth: 68,
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
    this._drawOuterHull(ctx);
    this._drawInteriorFloorboards(ctx);
    this._drawBenchSeats(ctx);
    this._drawGunwaleRimAndOarlocks(ctx);
    this._drawCrossedOars(ctx);
    this._drawCoiledBowRope(ctx);

    ctx.restore();
  }

  _boatPath(ctx, inset = 0) {
    const bowX = 68 - inset;
    const sternX = -65 + inset;
    const halfW = 30 - inset;
    const sternW = 19 - inset * 0.7;

    ctx.beginPath();
    ctx.moveTo(bowX, 0);
    ctx.bezierCurveTo(bowX - 16, -halfW * 0.9, 18, -halfW, -16, -halfW);
    ctx.bezierCurveTo(-44, -halfW, -58, -sternW - 3, sternX, -sternW);
    ctx.quadraticCurveTo(sternX - 3, 0, sternX, sternW);
    ctx.bezierCurveTo(-58, sternW + 3, -44, halfW, -16, halfW);
    ctx.bezierCurveTo(18, halfW, bowX - 16, halfW * 0.9, bowX, 0);
    ctx.closePath();
  }

  _drawAmbientShadow(ctx) {
    const grad = ctx.createRadialGradient(0, 4, 10, 0, 4, 74);
    grad.addColorStop(0, 'rgba(12, 20, 38, 0.5)');
    grad.addColorStop(0.68, 'rgba(12, 20, 38, 0.22)');
    grad.addColorStop(1, 'rgba(12, 20, 38, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 72, 34, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawOuterHull(ctx) {
    ctx.save();
    // Chunky clinker-built outer hull shell
    const hullGrad = ctx.createLinearGradient(0, -30, 0, 30);
    hullGrad.addColorStop(0, '#C48448');
    hullGrad.addColorStop(0.45, '#9A5F2D');
    hullGrad.addColorStop(1, '#663A17');

    this._boatPath(ctx, 0);
    ctx.fillStyle = hullGrad;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    // Clinker strake lap shadow lines near rim
    ctx.strokeStyle = 'rgba(42, 20, 10, 0.35)';
    ctx.lineWidth = 1.4;
    this._boatPath(ctx, 2.5);
    ctx.stroke();
    ctx.restore();
  }

  _drawInteriorFloorboards(ctx) {
    ctx.save();
    this._boatPath(ctx, 5.5);
    const floorGrad = ctx.createLinearGradient(0, -24, 0, 24);
    floorGrad.addColorStop(0, '#8A5428');
    floorGrad.addColorStop(0.5, '#A86D3A');
    floorGrad.addColorStop(1, '#75441E');
    ctx.fillStyle = floorGrad;
    ctx.fill();

    // Clip to interior for ribs & slatted floorboards
    ctx.save();
    ctx.clip();

    // Curved interior frame ribs
    ctx.strokeStyle = 'rgba(48, 26, 12, 0.55)';
    ctx.lineWidth = 2.6;
    for (const rx of [-44, -22, 0, 22, 42]) {
      ctx.beginPath();
      ctx.moveTo(rx, -26);
      ctx.lineTo(rx, 26);
      ctx.stroke();
    }

    // Longitudinal slatted duckboard planks
    const plankYs = [-13, -6.5, 0, 6.5, 13];
    for (const py of plankYs) {
      ctx.fillStyle = '#B87C46';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.fillRect(-54, py - 2.4, 104, 4.8);
      ctx.strokeRect(-54, py - 2.4, 104, 4.8);
    }

    // Inner ambient shadow along hull walls
    this._boatPath(ctx, 5.5);
    ctx.strokeStyle = 'rgba(20, 12, 28, 0.45)';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.restore();

    this._boatPath(ctx, 5.5);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  _drawBenchSeats(ctx) {
    // 3 wooden plank bench seats (stern, midship, bow)
    const seats = [
      { x: -55, w: 13, h: 36 },
      { x: -11, w: 14, h: 48 },
      { x: 31, w: 12, h: 36 },
    ];
    for (const s of seats) {
      // Bench drop shadow
      ctx.fillStyle = 'rgba(22, 12, 26, 0.34)';
      ctx.fillRect(s.x + 2, -s.h / 2 + 2, s.w, s.h);

      const grad = ctx.createLinearGradient(s.x, -s.h / 2, s.x + s.w, s.h / 2);
      grad.addColorStop(0, '#DFAA6E');
      grad.addColorStop(0.55, '#BF844A');
      grad.addColorStop(1, '#96602E');

      ctx.fillStyle = grad;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.2;
      ctx.fillRect(s.x, -s.h / 2, s.w, s.h);
      ctx.strokeRect(s.x, -s.h / 2, s.w, s.h);

      // Center plank seam & nail heads
      ctx.strokeStyle = 'rgba(30, 20, 43, 0.45)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(s.x + s.w / 2, -s.h / 2 + 1);
      ctx.lineTo(s.x + s.w / 2, s.h / 2 - 1);
      ctx.stroke();

      ctx.fillStyle = '#2B1D2E';
      for (const ny of [-s.h / 2 + 4.5, s.h / 2 - 4.5]) {
        ctx.beginPath();
        ctx.arc(s.x + 3.2, ny, 1.15, 0, Math.PI * 2);
        ctx.arc(s.x + s.w - 3.2, ny, 1.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  _drawGunwaleRimAndOarlocks(ctx) {
    ctx.save();
    // Crisp top gunwale highlight arc
    ctx.strokeStyle = 'rgba(255, 224, 176, 0.5)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-45, -26.5);
    ctx.quadraticCurveTo(10, -28.5, 58, -5);
    ctx.stroke();

    // Brass U-shaped oarlocks mounted on port & starboard midship gunwales
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#E8B642';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(-4, side * 27, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawOar(ctx, x, y, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    // Shadow under oar
    ctx.fillStyle = 'rgba(20, 12, 26, 0.3)';
    ctx.fillRect(-35, 1, 70, 4);

    // Turned wooden shaft
    const shaftGrad = ctx.createLinearGradient(0, -2.5, 0, 2.5);
    shaftGrad.addColorStop(0, '#F0C78B');
    shaftGrad.addColorStop(0.6, '#C99050');
    shaftGrad.addColorStop(1, '#8C5926');

    ctx.fillStyle = shaftGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(-36, -2.1, 56, 4.2);
    ctx.fill();
    ctx.stroke();

    // Tapered grip handle at left end
    ctx.fillStyle = '#7A461E';
    ctx.fillRect(-38, -1.6, 8, 3.2);
    ctx.strokeRect(-38, -1.6, 8, 3.2);

    // Broad rounded wooden paddle blade at right end
    const bladeGrad = ctx.createLinearGradient(16, -6, 38, 6);
    bladeGrad.addColorStop(0, '#E8B874');
    bladeGrad.addColorStop(0.65, '#C48A47');
    bladeGrad.addColorStop(1, '#945E28');

    ctx.fillStyle = bladeGrad;
    ctx.beginPath();
    ctx.moveTo(16, -2.2);
    ctx.quadraticCurveTo(26, -6.5, 36, -5.2);
    ctx.quadraticCurveTo(40, 0, 36, 5.2);
    ctx.quadraticCurveTo(26, 6.5, 16, 2.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Painted nautical red stripe near blade tip
    ctx.fillStyle = '#D93B48';
    ctx.fillRect(28, -4.4, 4.5, 8.8);
    ctx.strokeRect(28, -4.4, 4.5, 8.8);

    // Leather collar where oar rests in oarlock
    ctx.fillStyle = '#543322';
    ctx.fillRect(-10, -2.8, 7, 5.6);
    ctx.strokeRect(-10, -2.8, 7, 5.6);

    ctx.restore();
  }

  _drawCrossedOars(ctx) {
    // Two crossed wooden oars resting diagonally inside the dinghy
    this._drawOar(ctx, -6, 2, -0.26);
    this._drawOar(ctx, -4, -2, 0.24);
  }

  _drawCoiledBowRope(ctx) {
    ctx.save();
    // Braided bow painter rope coiled neatly in the bow tip
    const cx = 50;
    const cy = 0;

    // Mooring eye cleat at bow
    ctx.fillStyle = '#E8B642';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(61, 0, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Concentric braided rope rings
    for (const r of [8.2, 5.0, 2.2]) {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 4.6;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = r === 5.0 ? '#E3BE7E' : '#CCA160';
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }
    ctx.restore();
  }
}

export default Rowboatobject;
