import { jsPDF } from 'jspdf';
import { ClassData, Connection } from '../types';
import { getAnchorPoint, intersect } from './geometry';
import { useUmlStore } from '../store/useUmlStore';

function getBoxRect(cls: ClassData) {
  const el = document.getElementById(`c-${cls.id}`);
  return {
    x: cls.x,
    y: cls.y,
    w: el?.offsetWidth || cls.width || 240,
    h: el?.offsetHeight || cls.height || 150,
  };
}

function getBoundingBox(classes: ClassData[]) {
  if (classes.length === 0) return { x: 0, y: 0, w: 800, h: 600 };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const cls of classes) {
    const r = getBoxRect(cls);
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.w);
    maxY = Math.max(maxY, r.y + r.h);
  }

  const padding = 40;
  return {
    x: minX - padding,
    y: minY - padding,
    w: maxX - minX + padding * 2,
    h: maxY - minY + padding * 2,
  };
}

function getThemeColors() {
  const s = getComputedStyle(document.documentElement);
  return {
    bg: s.getPropertyValue('--bg-canvas').trim() || '#0f0f0f',
    card: s.getPropertyValue('--bg-card').trim() || '#1e1e1e',
    border: s.getPropertyValue('--border').trim() || '#2e2e2e',
    accent: s.getPropertyValue('--accent').trim() || '#6366f1',
    text: s.getPropertyValue('--text-primary').trim() || '#ffffff',
    textSecondary: s.getPropertyValue('--text-secondary').trim() || '#a0a0a0',
    header: s.getPropertyValue('--header-class').trim() || '#6366f1',
  };
}

function getConnectionPts(conn: Connection, classes: ClassData[]) {
  const fromClass = classes.find(c => c.id === conn.from);
  const toClass = classes.find(c => c.id === conn.to);
  if (!fromClass || !toClass) return null;

  const r1 = getBoxRect(fromClass);
  const r2 = getBoxRect(toClass);
  const c1 = { x: r1.x + r1.w / 2, y: r1.y + r1.h / 2 };
  const c2 = { x: r2.x + r2.w / 2, y: r2.y + r2.h / 2 };

  let p1, p2;

  if (conn.fromAnchor) {
    p1 = getAnchorPoint(r1, conn.fromAnchor);
  } else {
    const target = conn.toAnchor ? getAnchorPoint(r2, conn.toAnchor) : c2;
    p1 = intersect(c1, target, r1);
  }

  if (conn.toAnchor) {
    p2 = getAnchorPoint(r2, conn.toAnchor);
  } else {
    const source = conn.fromAnchor ? getAnchorPoint(r1, conn.fromAnchor) : c1;
    p2 = intersect(c2, source, r2);
  }

  return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
}

function drawConnection(
  ctx: CanvasRenderingContext2D,
  conn: Connection,
  classes: ClassData[],
  colors: ReturnType<typeof getThemeColors>
) {
  const pts = getConnectionPts(conn, classes);
  if (!pts) return;

  const angle = Math.atan2(pts.y2 - pts.y1, pts.x2 - pts.x1);

  ctx.beginPath();
  ctx.moveTo(pts.x1, pts.y1);
  ctx.lineTo(pts.x2, pts.y2);
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Filled arrowhead at end (association, aggregation, composition)
  if (conn.type === 'association' || conn.type === 'aggregation' || conn.type === 'composition') {
    ctx.save();
    ctx.translate(pts.x2, pts.y2);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-11, -5);
    ctx.lineTo(-11, 5);
    ctx.closePath();
    ctx.fillStyle = colors.accent;
    ctx.fill();
    ctx.restore();
  }

  // Open triangle at end (inheritance)
  if (conn.type === 'inheritance') {
    ctx.save();
    ctx.translate(pts.x2, pts.y2);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-14, -7);
    ctx.lineTo(-14, 7);
    ctx.closePath();
    ctx.fillStyle = colors.bg;
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Open diamond at start (aggregation)
  if (conn.type === 'aggregation') {
    ctx.save();
    ctx.translate(pts.x1, pts.y1);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(8, -5);
    ctx.lineTo(16, 0);
    ctx.lineTo(8, 5);
    ctx.closePath();
    ctx.fillStyle = colors.bg;
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Filled diamond at start (composition)
  if (conn.type === 'composition') {
    ctx.save();
    ctx.translate(pts.x1, pts.y1);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(8, -5);
    ctx.lineTo(16, 0);
    ctx.lineTo(8, 5);
    ctx.closePath();
    ctx.fillStyle = colors.accent;
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Label
  if (conn.attributeName) {
    const midX = (pts.x1 + pts.x2) / 2;
    const midY = (pts.y1 + pts.y2) / 2;
    const label = conn.isList ? `${conn.attributeName} [ ]` : conn.attributeName;

    ctx.font = '500 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(label);
    const pad = 4;
    ctx.fillStyle = colors.bg;
    ctx.fillRect(midX - metrics.width / 2 - pad, midY - 8, metrics.width + pad * 2, 16);

    ctx.fillStyle = colors.text;
    ctx.fillText(label, midX, midY);
  }
}

// Draw a rounded rectangle
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Draw a rounded rectangle clipped to the top portion (for header)
function roundRectTop(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawClassBox(
  ctx: CanvasRenderingContext2D,
  cls: ClassData,
  colors: ReturnType<typeof getThemeColors>,
  allClasses: ClassData[]
) {
  const rect = getBoxRect(cls);
  const { x, y, w } = rect;
  const radius = 12;
  const headerH = 48;
  const rowH = 28;
  const sectionPadY = 8;
  const fontSize = 13;

  // Calculate total height from content
  const attrSectionH = sectionPadY * 2 + Math.max(cls.attributes.length, 0) * rowH + 28; // +28 for "Add" button space
  const methodSectionH = sectionPadY * 2 + Math.max(cls.methods.length, 0) * rowH + 28;
  const totalH = rect.h || (headerH + attrSectionH + methodSectionH);

  // Card background with rounded corners
  roundRect(ctx, x, y, w, totalH, radius);
  ctx.fillStyle = colors.card;
  ctx.fill();
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Header
  roundRectTop(ctx, x, y, w, headerH, radius);
  ctx.fillStyle = colors.header;
  ctx.fill();

  // Class name
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cls.name, x + w / 2, y + headerH / 2, w - 20);

  // Separator line after header
  let curY = y + headerH;

  // Attributes section
  ctx.font = `${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const classNames = allClasses.map(c => c.name);

  for (let i = 0; i < cls.attributes.length; i++) {
    const attr = cls.attributes[i];
    const rowY = curY + sectionPadY + i * rowH + rowH / 2;

    // Visibility marker
    ctx.fillStyle = colors.textSecondary;
    ctx.fillText('-', x + 16, rowY);

    // Attribute name
    ctx.fillStyle = colors.text;
    const nameText = attr.name;
    ctx.fillText(nameText, x + 28, rowY);
    const nameWidth = ctx.measureText(nameText).width;

    // Colon
    ctx.fillStyle = colors.textSecondary;
    ctx.fillText(':', x + 28 + nameWidth + 4, rowY);

    // Type (highlight if it's a class type)
    const typeText = attr.isList ? `${attr.type} [ ]` : attr.type;
    if (classNames.includes(attr.type)) {
      ctx.fillStyle = colors.accent;
      ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
    } else {
      ctx.fillStyle = colors.text;
      ctx.font = `${fontSize}px system-ui, sans-serif`;
    }
    ctx.fillText(typeText, x + 28 + nameWidth + 16, rowY);
    ctx.font = `${fontSize}px system-ui, sans-serif`;
  }

  // Separator before methods
  curY += sectionPadY * 2 + cls.attributes.length * rowH;
  ctx.beginPath();
  ctx.moveTo(x, curY);
  ctx.lineTo(x + w, curY);
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Methods section
  for (let i = 0; i < cls.methods.length; i++) {
    const method = cls.methods[i];
    const rowY = curY + sectionPadY + i * rowH + rowH / 2;

    // Visibility marker
    ctx.fillStyle = colors.textSecondary;
    ctx.fillText('+', x + 16, rowY);

    // Method name
    ctx.fillStyle = colors.text;
    const mNameText = method.name;
    ctx.fillText(mNameText, x + 28, rowY);
    const mNameWidth = ctx.measureText(mNameText).width;

    // () :
    ctx.fillStyle = colors.textSecondary;
    ctx.fillText('() :', x + 28 + mNameWidth + 2, rowY);
    const parensWidth = ctx.measureText('() :').width;

    // Return type
    const retText = method.returnType;
    if (classNames.includes(retText)) {
      ctx.fillStyle = colors.accent;
      ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
    } else {
      ctx.fillStyle = colors.text;
      ctx.font = `${fontSize}px system-ui, sans-serif`;
    }
    ctx.fillText(retText, x + 28 + mNameWidth + 2 + parensWidth + 4, rowY);
    ctx.font = `${fontSize}px system-ui, sans-serif`;
  }
}

async function renderToCanvas(scale: number) {
  const { classes, connections } = useUmlStore.getState();
  const bbox = getBoundingBox(classes);
  const colors = getThemeColors();

  const offscreen = document.createElement('canvas');
  offscreen.width = Math.ceil(bbox.w) * scale;
  offscreen.height = Math.ceil(bbox.h) * scale;
  const ctx = offscreen.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.translate(-bbox.x, -bbox.y);

  // Background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(bbox.x, bbox.y, bbox.w, bbox.h);

  // Draw connections first (behind boxes)
  for (const conn of connections) {
    drawConnection(ctx, conn, classes, colors);
  }

  // Draw class boxes on top
  for (const cls of classes) {
    drawClassBox(ctx, cls, colors, classes);
  }

  return { canvas: offscreen, bbox };
}

function download(url: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
}

export async function exportAsPng() {
  const { canvas } = await renderToCanvas(2);
  download(canvas.toDataURL('image/png'), 'uml-diagram.png');
}

export async function exportAsSvg() {
  const { canvas, bbox } = await renderToCanvas(2);
  const pngDataUrl = canvas.toDataURL('image/png');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(bbox.w)}" height="${Math.ceil(bbox.h)}">
  <image href="${pngDataUrl}" width="${Math.ceil(bbox.w)}" height="${Math.ceil(bbox.h)}" />
</svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  download(URL.createObjectURL(blob), 'uml-diagram.svg');
}

export async function exportAsPdf() {
  const { canvas, bbox } = await renderToCanvas(2);
  const dataUrl = canvas.toDataURL('image/png');

  const orientation = bbox.w > bbox.h ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation: orientation as 'landscape' | 'portrait',
    unit: 'px',
    format: [bbox.w, bbox.h],
  });

  pdf.addImage(dataUrl, 'PNG', 0, 0, bbox.w, bbox.h);
  pdf.save('uml-diagram.pdf');
}
