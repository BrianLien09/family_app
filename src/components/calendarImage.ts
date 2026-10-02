import { format, isSameMonth } from 'date-fns';
import { DateItem } from '@/types';
import { CategoryColorMap, getCategoryColorStyles } from '@/lib/categoryColors';

const FONT_FAMILY = '"Microsoft JhengHei", "Noto Sans TC", sans-serif';
const TITLE_FONT_SIZE = 22;
const MIN_TITLE_FONT_SIZE = 16;

interface ImageEvent {
  event: DateItem;
  lines: string[];
  time: string;
  fontSize: number;
  lineHeight: number;
  height: number;
}

function wrapTitle(context: CanvasRenderingContext2D, title: string, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of title.split('\n')) {
    let line = '';
    const tokens: string[] = [];
    // 右括號與前一個字一起換行，避免括號單獨出現在下一行。
    for (const character of Array.from(paragraph)) {
      if ((character === '）' || character === ')') && tokens.length > 0) {
        tokens[tokens.length - 1] += character;
      } else tokens.push(character);
    }
    for (const token of tokens) {
      if (line && context.measureText(line + token).width > width) {
        lines.push(line);
        line = token;
      } else line += token;
    }
    lines.push(line);
  }
  return lines;
}

function drawText(context: CanvasRenderingContext2D, text: string, x: number, top: number): void {
  // 以實際字形高度定位，避免匯出時中文基線造成標籤上方額外留白。
  context.fillText(text, x, top + context.measureText(text).actualBoundingBoxAscent);
}

function fitTitle(context: CanvasRenderingContext2D, title: string, width: number) {
  let fontSize = TITLE_FONT_SIZE;
  context.font = `700 ${fontSize}px ${FONT_FAMILY}`;
  if (!title.includes('\n')) {
    while (context.measureText(title).width > width && fontSize > MIN_TITLE_FONT_SIZE) {
      fontSize -= 1;
      context.font = `700 ${fontSize}px ${FONT_FAMILY}`;
    }
    // 一般標題縮小到可單行顯示；過長的標題仍保留易讀字級並完整換行。
    if (context.measureText(title).width > width) {
      fontSize = TITLE_FONT_SIZE;
      context.font = `700 ${fontSize}px ${FONT_FAMILY}`;
    }
  }
  return { fontSize, lineHeight: fontSize + 6, lines: wrapTitle(context, title, width) };
}

export async function createCalendarImage(
  month: Date,
  days: Date[],
  eventsByDate: Record<string, DateItem[]>,
  categoryColors: CategoryColorMap,
): Promise<Blob> {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('無法產生月曆圖片');
  const width = 1600;
  const padding = 32;
  const gap = 4;
  const columnWidth = (width - padding * 2 - gap * 6) / 7;
  const gridTop = 136;
  const contents: ImageEvent[][] = days.map(day => (eventsByDate[format(day, 'yyyy-MM-dd')] ?? []).map(event => {
    const layout = fitTitle(context, event.title, columnWidth - 36);
    const time = [event.startTime, event.endTime].filter(Boolean).join('–');
    return { event, ...layout, time, height: 12 + layout.lines.length * layout.lineHeight + (time ? 24 : 0) };
  }));
  const rowHeights: number[] = [];
  for (let index = 0; index < days.length; index += 7) {
    rowHeights.push(Math.max(150, ...contents.slice(index, index + 7).map(items =>
      42 + items.reduce((height, item) => height + item.height + 6, 0),
    )));
  }
  const height = gridTop + rowHeights.reduce((total, row) => total + row + gap, 0) - gap + padding;
  canvas.width = width * 1.5;
  canvas.height = Math.ceil(height * 1.5);
  context.scale(1.5, 1.5);
  context.textBaseline = 'alphabetic';
  context.fillStyle = '#f0ece1';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#3d3a36';
  context.font = `700 32px ${FONT_FAMILY}`;
  drawText(context, format(month, 'yyyy年 M月'), padding, padding);
  context.font = `700 20px ${FONT_FAMILY}`;
  ['一', '二', '三', '四', '五', '六', '日'].forEach((label, column) => {
    const x = padding + column * (columnWidth + gap) + (columnWidth - context.measureText(label).width) / 2;
    drawText(context, label, x, 105);
  });
  let rowTop = gridTop;
  days.forEach((day, index) => {
    const column = index % 7;
    const row = Math.floor(index / 7);
    const x = padding + column * (columnWidth + gap);
    context.fillStyle = isSameMonth(day, month) ? '#e9e3d9' : '#e2dace';
    context.fillRect(x, rowTop, columnWidth, rowHeights[row]);
    context.strokeStyle = '#dcd0c2';
    context.lineWidth = 1;
    context.setLineDash([]);
    context.strokeRect(x + 0.5, rowTop + 0.5, columnWidth - 1, rowHeights[row] - 1);
    context.fillStyle = isSameMonth(day, month) ? '#3d3a36' : '#75716b';
    context.font = `400 18px ${FONT_FAMILY}`;
    drawText(context, format(day, 'd'), x + 10, rowTop + 10);
    let itemTop = rowTop + 36;
    for (const item of contents[index]) {
      const colors = getCategoryColorStyles(item.event.category, categoryColors).event;
      context.beginPath();
      context.roundRect(x + 10, itemTop, columnWidth - 20, item.height, 6);
      context.fillStyle = colors.backgroundColor;
      context.fill();
      context.strokeStyle = colors.borderColor;
      context.lineWidth = 2;
      context.setLineDash([5, 4]);
      context.stroke();
      context.fillStyle = colors.color;
      context.font = `700 ${item.fontSize}px ${FONT_FAMILY}`;
      item.lines.forEach((line, lineIndex) => drawText(context, line, x + 18, itemTop + 6 + lineIndex * item.lineHeight));
      if (item.time) {
        context.font = `400 18px ${FONT_FAMILY}`;
        drawText(context, item.time, x + 18, itemTop + 8 + item.lines.length * item.lineHeight);
      }
      itemTop += item.height + 6;
    }
    if (column === 6) rowTop += rowHeights[row] + gap;
  });
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('無法產生月曆圖片')), 'image/png');
  });
}

export function downloadCalendarImage(blob: Blob, month: Date): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `月曆-${format(month, 'yyyy-MM')}.png`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
