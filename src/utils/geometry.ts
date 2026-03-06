import { Point, Rect, AnchorPoint } from '../types';

export function intersect(p1: Point, p2: Point, r: Rect): Point {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  if (dx === 0 && dy === 0) return p1;
  
  const tx = dx > 0 ? (r.x + r.w - p1.x) / dx : (r.x - p1.x) / dx;
  const ty = dy > 0 ? (r.y + r.h - p1.y) / dy : (r.y - p1.y) / dy;
  const t = Math.min(tx, ty);
  
  return { x: p1.x + t * dx, y: p1.y + t * dy };
}

export function getPts(r1: Rect, r2: Rect): { x1: number, y1: number, x2: number, y2: number } {
  const c1 = { x: r1.x + r1.w / 2, y: r1.y + r1.h / 2 };
  const c2 = { x: r2.x + r2.w / 2, y: r2.y + r2.h / 2 };
  
  const p1 = intersect(c1, c2, r1);
  const p2 = intersect(c2, c1, r2);
  
  return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
}

export function getAnchorPoint(rect: Rect, anchor: AnchorPoint): Point {
  switch (anchor.side) {
    case 't': return { x: rect.x + rect.w * anchor.ratio, y: rect.y };
    case 'b': return { x: rect.x + rect.w * anchor.ratio, y: rect.y + rect.h };
    case 'l': return { x: rect.x, y: rect.y + rect.h * anchor.ratio };
    case 'r': return { x: rect.x + rect.w, y: rect.y + rect.h * anchor.ratio };
  }
}

export function snapToEdge(rect: Rect, point: Point): AnchorPoint {
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const edges: { side: AnchorPoint['side']; dist: number; ratio: number }[] = [
    { side: 't', dist: Math.abs(point.y - rect.y), ratio: clamp((point.x - rect.x) / rect.w, 0, 1) },
    { side: 'b', dist: Math.abs(point.y - (rect.y + rect.h)), ratio: clamp((point.x - rect.x) / rect.w, 0, 1) },
    { side: 'l', dist: Math.abs(point.x - rect.x), ratio: clamp((point.y - rect.y) / rect.h, 0, 1) },
    { side: 'r', dist: Math.abs(point.x - (rect.x + rect.w)), ratio: clamp((point.y - rect.y) / rect.h, 0, 1) },
  ];

  const closest = edges.reduce((a, b) => (a.dist < b.dist ? a : b));
  return { side: closest.side, ratio: closest.ratio };
}
