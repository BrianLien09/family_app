// 純函式：不依賴 Workers 執行環境，才能在 Node 測試中直接驗證訊息格式。

export interface ScheduleEvent {
  date: string;
  displayTime: string;
  title: string;
  sortTime: string;
}

export type NotifyMode = 'tomorrow' | 'weekly';

const TIMEZONE = 'Asia/Taipei';
const WEEKDAY_NAMES = ['一', '二', '三', '四', '五', '六', '日'];
const DIVIDER = '━━━━━━━━━━━━';

// 日期一律用 YYYY-MM-DD 字串運算，避免本機或 UTC 時區造成跨日誤差
function parseDay(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(iso: string, days: number): string {
  const date = parseDay(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// 以週一為 0，與 Python 的 date.weekday() 一致
export function weekdayIndex(iso: string): number {
  return (parseDay(iso).getUTCDay() + 6) % 7;
}

// Worker 的系統時間是 UTC，必須明確換算成台灣日期，否則 22:00 前後會差一天
export function taipeiToday(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** 把 Firestore 文件轉成提醒用的行程；缺少日期的資料無法歸類，直接略過。 */
export function toScheduleEvent(data: Record<string, unknown>): ScheduleEvent | null {
  const date = readString(data.date);
  if (!date) return null;

  const startTime = readString(data.startTime);
  const endTime = readString(data.endTime);
  // 舊資料只有 time 欄位，維持相容讀取
  const legacyTime = readString(data.time);

  let displayTime = '全天';
  let sortTime = '';

  if (startTime) {
    sortTime = startTime;
    displayTime = endTime ? `${startTime} ~ ${endTime}` : startTime;
  } else if (legacyTime) {
    sortTime = legacyTime;
    displayTime = legacyTime;
  }

  return { date, displayTime, title: readString(data.title) || '未命名行程', sortTime };
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

// 全天行程 sortTime 為空字串，會自然排在最前面
export function sortEvents(events: ScheduleEvent[]): ScheduleEvent[] {
  return [...events].sort(
    (a, b) =>
      compareText(a.date, b.date) ||
      compareText(a.sortTime, b.sortTime) ||
      compareText(a.title, b.title),
  );
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDateLabel(iso: string): string {
  const date = parseDay(iso);
  return `${pad(date.getUTCMonth() + 1)}/${pad(date.getUTCDate())}（${WEEKDAY_NAMES[weekdayIndex(iso)]}）`;
}

function formatShortDate(iso: string): string {
  const date = parseDay(iso);
  return `${pad(date.getUTCMonth() + 1)}/${pad(date.getUTCDate())}`;
}

// 時間與標題分兩行：標題過長時 LINE 的自動換行才不會把時間擠得難讀
function formatEvent(event: ScheduleEvent): string {
  return `🕒 ${event.displayTime}\n　${event.title}`;
}

const TIPS = [
  '孔呆不要再修仙啦～',
  '老姐別滑手機了',
  '李小龍別玩 bubble 了',
  '孔呆今天降血壓藥吃了嗎？',
  '記得喝點水，補充水分～',
  '早點睡，明天才有精神 😴',
  '起來動一動，伸個懶腰吧',
  '睡前把手機放遠一點喔',
];

/** 隨機挑一則小叮嚀；random 由外部傳入，測試時才能固定結果。 */
export function pickTip(random: () => number): string {
  return TIPS[Math.floor(random() * TIPS.length)];
}

/** 隔日提醒：沒有行程也會發送，讓群組每晚都能收到小叮嚀。 */
export function buildTomorrowMessage(events: ScheduleEvent[], today: string, tip: string): string {
  const tomorrow = addDays(today, 1);
  const tomorrowEvents = sortEvents(events).filter(event => event.date === tomorrow);

  const body =
    tomorrowEvents.length > 0
      ? tomorrowEvents.map(formatEvent).join('\n\n')
      : '🍃 明天沒有行程，好好休息～';
  // 只有真的有行程才提醒設鬧鐘，沒行程時不必打擾
  const alarmLines = tomorrowEvents.length > 0 ? ['⏰ 記得設鬧鐘喔！'] : [];

  return [
    '🌙 明日行程提醒',
    DIVIDER,
    `📅 ${formatDateLabel(tomorrow)}`,
    '',
    body,
    DIVIDER,
    ...alarmLines,
    `💬 ${tip}`,
  ].join('\n');
}

/** 每週提醒：依日期分組列出整週（週一～週日）有行程的日子；沒有行程也會發送。 */
export function buildWeeklyMessage(events: ScheduleEvent[], weekStart: string, tip: string): string {
  const weekEnd = addDays(weekStart, 6);
  const inWeek = sortEvents(events).filter(event => event.date >= weekStart && event.date <= weekEnd);

  const dayBlocks: string[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const day = addDays(weekStart, offset);
    const dayEvents = inWeek.filter(event => event.date === day);
    if (dayEvents.length === 0) continue;
    dayBlocks.push([`📅 ${formatDateLabel(day)}`, ...dayEvents.map(formatEvent)].join('\n'));
  }

  return [
    '🗓️ 下週行程總覽',
    `${formatShortDate(weekStart)} ~ ${formatShortDate(weekEnd)}　共 ${inWeek.length} 項`,
    DIVIDER,
    dayBlocks.length > 0 ? dayBlocks.join('\n\n') : '🍃 下週沒有行程，輕鬆過～',
    DIVIDER,
    '祝大家有美好的一週 ✨',
    `💬 ${tip}`,
  ].join('\n');
}

/** 週日晚上提醒「下週」：一律以下一個週一為起點（週日 +1 天即週一）。 */
export function nextWeekStart(today: string): string {
  return addDays(today, 7 - weekdayIndex(today));
}
