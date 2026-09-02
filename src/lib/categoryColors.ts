export interface CategoryColorStyle {
  backgroundColor: string;
  color: string;
  borderColor: string;
}

export interface CategoryColorStyles {
  event: CategoryColorStyle;
  badge: CategoryColorStyle;
  dot: Pick<CategoryColorStyle, 'backgroundColor'>;
}

export type CategoryColorMap = ReadonlyMap<string, CategoryColorStyles>;

interface PaletteColor {
  accent: string;
  text: string;
  hue: number;
}

// 依預設分類順序配置暖色、藍色、紫色與青綠色，避免相鄰分類使用近似色。
const CATEGORY_COLOR_PALETTE: readonly PaletteColor[] = [
  { accent: '#6e8568', text: '#4e5f48', hue: 107 },
  { accent: '#b8956b', text: '#8c653d', hue: 32 },
  { accent: '#b86f5f', text: '#8f5045', hue: 11 },
  { accent: '#5f7186', text: '#4f6072', hue: 213 },
  { accent: '#8d7296', text: '#6b5574', hue: 290 },
  { accent: '#c3a653', text: '#8d752c', hue: 48 },
  { accent: '#5b8f8a', text: '#3f6e6a', hue: 176 },
  { accent: '#a9687f', text: '#864a62', hue: 338 },
];

function normalizeCategory(category: string): string {
  return category.trim();
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function createStyles({ accent, text }: PaletteColor): CategoryColorStyles {
  return {
    event: {
      backgroundColor: hexToRgba(accent, 0.15),
      color: text,
      borderColor: hexToRgba(accent, 0.35),
    },
    badge: {
      backgroundColor: hexToRgba(accent, 0.1),
      color: text,
      borderColor: hexToRgba(accent, 0.3),
    },
    dot: {
      backgroundColor: accent,
    },
  };
}

function hueDistance(first: number, second: number): number {
  const distance = Math.abs(first - second) % 360;
  return Math.min(distance, 360 - distance);
}

function chooseGeneratedHue(index: number, usedHues: readonly number[]): number {
  const preferredHue = (index * 137.508 + 23) % 360;
  const candidates = Array.from({ length: 72 }, (_, candidateIndex) => candidateIndex * 5);

  return candidates.reduce((bestHue, candidateHue) => {
    const candidateDistance = usedHues.length === 0
      ? 180
      : Math.min(...usedHues.map(usedHue => hueDistance(candidateHue, usedHue)));
    const bestDistance = usedHues.length === 0
      ? 180
      : Math.min(...usedHues.map(usedHue => hueDistance(bestHue, usedHue)));
    const candidateScore = candidateDistance - hueDistance(candidateHue, preferredHue) / 1000;
    const bestScore = bestDistance - hueDistance(bestHue, preferredHue) / 1000;
    return candidateScore > bestScore ? candidateHue : bestHue;
  }, Math.round(preferredHue));
}

function createGeneratedStyles(index: number, usedHues: readonly number[] = []): CategoryColorStyles {
  // 配色表用完後選擇距離既有色相最遠的候選色，讓新增分類仍保持可辨識。
  const hue = chooseGeneratedHue(index, usedHues);
  const accent = `hsl(${hue} 34% 46%)`;
  const text = `hsl(${hue} 38% 30%)`;
  const background = `hsl(${hue} 34% 46% / 0.15)`;
  const border = `hsl(${hue} 34% 46% / 0.35)`;
  const badgeBackground = `hsl(${hue} 34% 46% / 0.1)`;
  const badgeBorder = `hsl(${hue} 34% 46% / 0.3)`;

  return {
    event: { backgroundColor: background, color: text, borderColor: border },
    badge: { backgroundColor: badgeBackground, color: text, borderColor: badgeBorder },
    dot: { backgroundColor: accent },
  };
}

function hashCategory(category: string): number {
  return Array.from(category).reduce((hash, character) =>
    (hash * 31 + character.charCodeAt(0)) >>> 0, 0);
}

function createStylesForIndex(index: number, usedHues: readonly number[] = []): CategoryColorStyles {
  const paletteColor = CATEGORY_COLOR_PALETTE[index];
  return paletteColor ? createStyles(paletteColor) : createGeneratedStyles(index, usedHues);
}

export function createCategoryColorMap(categories: readonly string[]): CategoryColorMap {
  const uniqueCategories = Array.from(new Set(
    categories.map(normalizeCategory).filter(Boolean),
  ));

  const colorMap = new Map<string, CategoryColorStyles>();
  const usedHues: number[] = [];

  uniqueCategories.forEach((category, index) => {
    const paletteColor = CATEGORY_COLOR_PALETTE[index];
    const styles = createStylesForIndex(index, usedHues);
    colorMap.set(category, styles);
    usedHues.push(paletteColor?.hue ?? chooseGeneratedHue(index, usedHues));
  });

  return colorMap;
}

export function getCategoryColorStyles(
  category: string,
  categoryColors: CategoryColorMap,
): CategoryColorStyles {
  const normalizedCategory = normalizeCategory(category);
  return categoryColors.get(normalizedCategory)
    ?? createStylesForIndex(CATEGORY_COLOR_PALETTE.length + (hashCategory(normalizedCategory) % 360));
}
