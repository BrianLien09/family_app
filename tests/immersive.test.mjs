import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

test('沉浸視窗共用鎖定，最後關閉才還原原始捲動狀態', () => {
  const cleanups = [];
  const document = { body: { style: { overflow: 'auto' }, dataset: {} } };
  const loadedModule = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(new URL('../src/hooks/useImmersiveMode.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(source, { document, module: loadedModule, exports: loadedModule.exports, require: () => ({ useEffect: effect => cleanups.push(effect()) }) });
  loadedModule.exports.useImmersiveMode(false);
  assert.equal(document.body.style.overflow, 'auto');
  loadedModule.exports.useImmersiveMode(true);
  loadedModule.exports.useImmersiveMode(true);
  assert.equal(document.body.style.overflow, 'hidden');
  assert.equal(document.body.dataset.immersive, 'true');
  cleanups[1]();
  assert.equal(document.body.dataset.immersive, 'true');
  cleanups[2]();
  assert.equal(document.body.style.overflow, 'auto');
  assert.equal(document.body.dataset.immersive, undefined);
});
