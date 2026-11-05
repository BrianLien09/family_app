import { fetchEvents } from './firestore';
import { pushLineMessage } from './line';
import {
  addDays,
  buildTomorrowMessage,
  buildWeeklyMessage,
  nextWeekStart,
  pickTip,
  taipeiToday,
  weekdayIndex,
  type NotifyMode,
} from './messages';

interface Env {
  LINE_CHANNEL_ACCESS_TOKEN: string;
  LINE_USER_ID: string;
  FIREBASE_CREDENTIALS: string;
  TRIGGER_SECRET: string;
}

// weekdayIndex 以週一為 0，週日為 6
const SUNDAY_INDEX = 6;

function isNotifyMode(value: string | null): value is NotifyMode {
  return value === 'tomorrow' || value === 'weekly';
}

async function runNotify(env: Env, mode: NotifyMode): Promise<string> {
  const today = taipeiToday(new Date());

  // 行程與小叮嚀合成同一則文字訊息：LINE 以「一次推播的收件人數」計費，拆成兩則會多花額度
  const tip = pickTip(Math.random);

  let message: string;
  if (mode === 'weekly') {
    const weekStart = nextWeekStart(today);
    const events = await fetchEvents(env.FIREBASE_CREDENTIALS, weekStart, addDays(weekStart, 6));
    message = buildWeeklyMessage(events, weekStart, tip);
  } else {
    const tomorrow = addDays(today, 1);
    const events = await fetchEvents(env.FIREBASE_CREDENTIALS, tomorrow, tomorrow);
    message = buildTomorrowMessage(events, today, tip);
  }

  await pushLineMessage(env.LINE_CHANNEL_ACCESS_TOKEN, env.LINE_USER_ID, message);
  return `已送出提醒（模式：${mode}）`;
}

export default {
  async scheduled(_controller, env): Promise<void> {
    // 週日改發下週總覽，其餘日子發隔日提醒，避免週日與週一的內容重複
    const isSunday = weekdayIndex(taipeiToday(new Date())) === SUNDAY_INDEX;
    const mode: NotifyMode = isSunday ? 'weekly' : 'tomorrow';
    console.log(await runNotify(env, mode));
  },

  // 手動測試入口：取代原 workflow_dispatch，需帶密鑰才能觸發
  async fetch(request, env): Promise<Response> {
    if (request.headers.get('Authorization') !== `Bearer ${env.TRIGGER_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }
    const mode = new URL(request.url).searchParams.get('mode');
    if (!isNotifyMode(mode)) {
      return new Response('mode 必須是 tomorrow 或 weekly', { status: 400 });
    }
    try {
      return new Response(await runNotify(env, mode));
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      return new Response(`通知執行失敗：${detail}`, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
