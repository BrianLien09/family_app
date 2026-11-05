import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));

// messages.ts 是不依賴 Workers 的純函式，轉譯成 CommonJS 後可直接在 Node 驗證
function loadMessages() {
  const source = fs.readFileSync(
    path.join(testDirectory, '..', 'notify-worker', 'src', 'messages.ts'),
    'utf8',
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const moduleShim = { exports: {} };
  new Function('module', 'exports', outputText)(moduleShim, moduleShim.exports);
  return moduleShim.exports;
}

const messages = loadMessages();

function makeEvent(date, start, end, title = '測試') {
  return messages.toScheduleEvent({ date, title, startTime: start, endTime: end });
}

test('隔日提醒只列明天且全天行程排在最前', () => {
  const events = [
    makeEvent('2026-11-02', '10:00', '11:30', '期中開書考'),
    makeEvent('2026-11-03', '09:00', '10:00', '洗牙'),
    makeEvent('2026-11-03', undefined, undefined, '繳費'),
  ];
  const message = messages.buildTomorrowMessage(events, '2026-11-02', '測試叮嚀');
  assert.ok(message.includes('11/03（二）'));
  assert.ok(!message.includes('期中開書考'));
  assert.ok(message.indexOf('繳費') < message.indexOf('洗牙'));
  assert.ok(message.includes('🕒 09:00 ~ 10:00\n　洗牙'));
  assert.ok(message.includes('⏰ 記得設鬧鐘喔！'));
  assert.ok(message.endsWith('💬 測試叮嚀'));
});

test('明天沒行程時仍會產生訊息，並附上小叮嚀且不提醒鬧鐘', () => {
  const message = messages.buildTomorrowMessage([makeEvent('2026-11-02', '10:00')], '2026-11-02', '測試叮嚀');
  assert.ok(message.includes('明天沒有行程'));
  assert.ok(!message.includes('鬧鐘'));
  assert.ok(message.endsWith('💬 測試叮嚀'));
});

test('週報依日期分組並排除範圍外行程', () => {
  const events = [
    makeEvent('2026-11-08', '08:00', undefined, '週日班'),
    makeEvent('2026-11-02', '10:00', '11:30', '期中開書考'),
    makeEvent('2026-11-09', '08:00', undefined, '範圍外事件'),
    makeEvent('2026-11-02', undefined, undefined, '全天事項'),
  ];
  const message = messages.buildWeeklyMessage(events, '2026-11-02', '測試叮嚀');
  assert.ok(message.includes('共 3 項'));
  assert.ok(message.endsWith('💬 測試叮嚀'));
  assert.ok(message.includes('11/02 ~ 11/08'));
  assert.ok(!message.includes('範圍外事件'));
  assert.ok(message.indexOf('11/02（一）') < message.indexOf('11/08（日）'));
  assert.ok(message.indexOf('全天事項') < message.indexOf('期中開書考'));
});

test('整週沒行程時仍會產生訊息', () => {
  const message = messages.buildWeeklyMessage([], '2026-11-02', '測試叮嚀');
  assert.ok(message.includes('共 0 項'));
  assert.ok(message.includes('下週沒有行程'));
  assert.ok(message.endsWith('💬 測試叮嚀'));
});

test('小叮嚀依亂數取值且不會超出清單範圍', () => {
  const first = messages.pickTip(() => 0);
  const last = messages.pickTip(() => 0.999999);
  assert.ok(first.length > 0 && last.length > 0);
  assert.notEqual(first, last);
});

test('舊版 time 欄位仍可讀取，缺日期的資料略過', () => {
  const legacy = messages.toScheduleEvent({ date: '2026-11-02', time: '18:00', title: '聚餐' });
  assert.equal(legacy.displayTime, '18:00');
  assert.equal(messages.toScheduleEvent({ title: '沒日期' }), null);
});

test('以台灣時區換算今天，UTC 14:00 已是台灣當晚 22:00', () => {
  // UTC 11/01 16:30 在台灣已是 11/02 00:30
  assert.equal(messages.taipeiToday(new Date('2026-11-01T16:30:00Z')), '2026-11-02');
  assert.equal(messages.taipeiToday(new Date('2026-11-01T14:00:00Z')), '2026-11-01');
});

test('週日晚上的下週起點是隔天週一', () => {
  // 2026-11-08 是週日
  assert.equal(messages.nextWeekStart('2026-11-08'), '2026-11-09');
  assert.equal(messages.weekdayIndex('2026-11-09'), 0);
});
