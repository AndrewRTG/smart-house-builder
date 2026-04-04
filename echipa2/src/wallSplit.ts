/** Punct pe grila discretă (aceleași coordonate ca în GridCanvas). */
export type GridPoint = { col: number; row: number };

export type WallPiece = { start: GridPoint; end: GridPoint };

/** Linia discretă Bresenham între două puncte de grilă (ordine: start → end). */
export function gridPointsOnSegment(start: GridPoint, end: GridPoint): GridPoint[] {
  let x0 = start.col;
  let y0 = start.row;
  const x1 = end.col;
  const y1 = end.row;
  const points: GridPoint[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  for (;;) {
    points.push({ col: x0, row: y0 });
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
  return points;
}

function samePoint(a: GridPoint, b: GridPoint): boolean {
  return a.col === b.col && a.row === b.row;
}

/**
 * Dacă deschiderea (ușă/fereastră) stă exact pe perete, întoarce două bucăți de perete
 * (înainte și după deschidere). Altfel null — peretele rămâne întreg.
 */
export function splitWallByOpening(
  wallStart: GridPoint,
  wallEnd: GridPoint,
  openingStart: GridPoint,
  openingEnd: GridPoint
): { before: WallPiece | null; after: WallPiece | null } | null {
  const pts = gridPointsOnSegment(wallStart, wallEnd);
  let i = pts.findIndex((p) => samePoint(p, openingStart));
  let j = pts.findIndex((p) => samePoint(p, openingEnd));
  if (i === -1 || j === -1) return null;
  if (i > j) [i, j] = [j, i];
  if (i === j) return null;

  const before: WallPiece | null =
    i > 0 ? { start: pts[0], end: pts[i] } : null;
  const after: WallPiece | null =
    j < pts.length - 1 ? { start: pts[j], end: pts[pts.length - 1] } : null;

  return { before, after };
}
