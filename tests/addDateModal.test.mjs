import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const moduleSource = fs.readFileSync(new URL('../src/hooks/useModalViewport.ts', import.meta.url), 'utf8');
const modalSource = fs.readFileSync(new URL('../src/components/DateManager/AddDateModal.tsx', import.meta.url), 'utf8');

function createWindow(visualViewport) {
  const frames = new Map();
  const cancelledFrames = [];
  const windowListeners = new Map();
  const viewportListeners = new Map();
  let nextFrameId = 1;
  let scrollCalls = 0;

  const addListener = (listeners, name, callback) => {
    const callbacks = listeners.get(name) ?? new Set();
    callbacks.add(callback);
    listeners.set(name, callbacks);
  };
  const removeListener = (listeners, name, callback) => listeners.get(name)?.delete(callback);

  const windowObject = {
    visualViewport,
    innerHeight: 720,
    requestAnimationFrame(callback) {
      const id = nextFrameId++;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) {
      cancelledFrames.push(id);
      frames.delete(id);
    },
    addEventListener(name, callback) { addListener(windowListeners, name, callback); },
    removeEventListener(name, callback) { removeListener(windowListeners, name, callback); },
    scrollTo() { scrollCalls++; },
    dispatchWindowEvent(name) {
      for (const callback of windowListeners.get(name) ?? []) callback();
    },
    dispatchViewportEvent(name) {
      for (const callback of viewportListeners.get(name) ?? []) callback();
    },
    runFrame(id = frames.keys().next().value) {
      const callback = frames.get(id);
      assert.ok(callback, '預期有排程中的 viewport 更新');
      frames.delete(id);
      callback(0);
    },
    get pendingFrameCount() { return frames.size; },
    get cancelledFrames() { return cancelledFrames; },
    get activeWindowListeners() { return [...windowListeners.values()].reduce((count, callbacks) => count + callbacks.size, 0); },
    get activeViewportListeners() { return [...viewportListeners.values()].reduce((count, callbacks) => count + callbacks.size, 0); },
    get scrollCalls() { return scrollCalls; },
  };

  if (visualViewport) {
    visualViewport.addEventListener = (name, callback) => addListener(viewportListeners, name, callback);
    visualViewport.removeEventListener = (name, callback) => removeListener(viewportListeners, name, callback);
  }

  return windowObject;
}

function loadHook(windowObject) {
  const effects = [];
  const loadedModule = { exports: {} };
  const source = ts.transpileModule(moduleSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(source, {
    module: loadedModule,
    exports: loadedModule.exports,
    window: windowObject,
    require(name) {
      if (name === 'react') return { useEffect: effect => effects.push(effect) };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return { useModalViewport: loadedModule.exports.useModalViewport, effects };
}

function createElement() {
  const properties = new Map();
  return {
    properties,
    style: {
      setProperty(name, value) { properties.set(name, value); },
      removeProperty(name) { properties.delete(name); },
    },
    scrollIntoViewCalls: 0,
    scrollIntoView() { this.scrollIntoViewCalls++; },
  };
}

test('同步可視高度與偏移，並合併同一影格內的多個 viewport 事件', () => {
  const visualViewport = { height: 640, offsetTop: 24 };
  const windowObject = createWindow(visualViewport);
  const element = createElement();
  const { useModalViewport, effects } = loadHook(windowObject);

  useModalViewport({ current: element }, true);
  const cleanup = effects[0]();
  assert.equal(element.properties.get('--modal-viewport-height'), '640px');
  assert.equal(element.properties.get('--modal-viewport-top'), '24px');

  visualViewport.height = 360;
  visualViewport.offsetTop = 160;
  windowObject.dispatchViewportEvent('resize');
  windowObject.dispatchViewportEvent('scroll');
  assert.equal(windowObject.pendingFrameCount, 1);

  windowObject.runFrame();
  assert.equal(element.properties.get('--modal-viewport-height'), '360px');
  assert.equal(element.properties.get('--modal-viewport-top'), '160px');
  assert.equal(windowObject.scrollCalls, 0);
  assert.equal(element.scrollIntoViewCalls, 0);
  cleanup();
});

test('沒有 VisualViewport 時以 innerHeight 初始化並回應視窗尺寸變更', () => {
  const windowObject = createWindow(null);
  const element = createElement();
  const { useModalViewport, effects } = loadHook(windowObject);

  useModalViewport({ current: element }, true);
  const cleanup = effects[0]();
  assert.equal(element.properties.get('--modal-viewport-height'), '720px');
  assert.equal(element.properties.get('--modal-viewport-top'), '0px');

  windowObject.innerHeight = 500;
  windowObject.dispatchWindowEvent('resize');
  windowObject.runFrame();
  assert.equal(element.properties.get('--modal-viewport-height'), '500px');
  cleanup();
});

test('停用時不註冊事件，卸載會取消待處理更新並清除樣式', () => {
  const visualViewport = { height: 600, offsetTop: 0 };
  const windowObject = createWindow(visualViewport);
  const element = createElement();
  const { useModalViewport, effects } = loadHook(windowObject);

  useModalViewport({ current: element }, false);
  effects[0]();
  assert.equal(windowObject.activeWindowListeners, 0);
  assert.equal(windowObject.activeViewportListeners, 0);

  useModalViewport({ current: element }, true);
  const cleanup = effects[1]();
  windowObject.dispatchViewportEvent('resize');
  assert.equal(windowObject.pendingFrameCount, 1);
  assert.equal(element.properties.has('--modal-viewport-height'), true);

  cleanup();
  assert.equal(windowObject.pendingFrameCount, 0);
  assert.equal(windowObject.cancelledFrames.length, 1);
  assert.equal(windowObject.activeWindowListeners, 0);
  assert.equal(windowObject.activeViewportListeners, 0);
  assert.equal(element.properties.has('--modal-viewport-height'), false);
  assert.equal(element.properties.has('--modal-viewport-top'), false);
});

test('行程表單固定標頭與操作列，只讓欄位區捲動且不自動聚焦輸入框', () => {
  const formStart = modalSource.indexOf('<form onSubmit={handleSubmit}');
  const bodyStart = modalSource.indexOf('overflow-y-auto overscroll-contain', formStart);
  const footerStart = modalSource.indexOf('flex shrink-0 justify-end', bodyStart);
  const formEnd = modalSource.indexOf('</form>', footerStart);

  assert.doesNotMatch(modalSource, /\bautoFocus\b/);
  assert.ok(formStart >= 0 && bodyStart > formStart && footerStart > bodyStart && formEnd > footerStart);
  assert.match(modalSource, /<fieldset disabled=\{isSubmitting\}/);
  assert.match(modalSource, /<SaveButton[\s\S]*?isSubmitting=\{isSubmitting\}[\s\S]*?type="submit"/);
  assert.match(modalSource, /disabled=\{isSubmitting\}[\s\S]*?onClick=\{close\}/);
});
