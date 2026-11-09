import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { CATEGORIES } from './elements.js';

const read = name => readFileSync(fileURLToPath(new URL(name, import.meta.url)), 'utf8');
const html = read('../index.html');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
assert.equal(scripts.length, 2);
scripts.forEach(source => new vm.Script(source));
const source = read('./theme.js').replace(/^import .*;\s*$/gm, '').replace(/^export /gm, '');
const boot = scripts[0];
function harness(stored, blocked = false) {
  const data = new Map(stored == null ? [] : [['elementa-theme', stored]]);
  const buttons = ['light', 'dark'].map(name => ({
    dataset: { themeChoice: name }, attrs: {},
    setAttribute(key, value) { this.attrs[key] = value; }, addEventListener() {},
  }));
  const document = { documentElement: { dataset: {} }, querySelectorAll: () => buttons };
  const localStorage = {
    getItem: key => { if (blocked) throw Error('blocked'); return data.get(key); },
    setItem: (key, value) => { if (blocked) throw Error('blocked'); data.set(key, value); },
  };
  const context = vm.createContext({ document, localStorage, CATEGORIES, window: new EventTarget(), Event });
  vm.runInContext(boot, context);
  vm.runInContext(source + '\nglobalThis.api = {getTheme,setTheme,initThemeControls,onThemeChange,categoryColor,renderTheme};', context);
  context.api.initThemeControls();
  return { ...context, buttons, data };
}
for (const [stored, expected] of [[null, 'dark'], ['dark', 'dark'], ['light', 'light'], ['invalid', 'dark']]) {
  const h = harness(stored);
  assert.equal(h.api.getTheme(), expected);
  assert.equal(h.document.documentElement.dataset.theme, expected);
  let changes = 0; h.api.onThemeChange(() => changes++);
  for (const name of ['light', 'dark', 'light']) {
    h.api.setTheme(name);
    assert.equal(h.api.getTheme(), name);
    assert.equal(h.data.get('elementa-theme'), name);
    assert.equal(h.buttons.filter(b => b.attrs['aria-pressed'] === 'true').length, 1);
    assert.equal(h.buttons.find(b => b.attrs['aria-pressed'] === 'true').dataset.themeChoice, name);
  }
  const count = changes; h.api.setTheme('light'); h.api.setTheme('invalid');
  assert.equal(changes, count, 'No redundant texture notification');
}
const blocked = harness(null, true);
assert.equal(blocked.api.getTheme(), 'dark');
assert.doesNotThrow(() => blocked.api.setTheme('light'));
assert.equal(blocked.api.getTheme(), 'light');
const luminance = hex => {
  const c = hex.match(/[a-f\d]{2}/gi).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return c[0] * .2126 + c[1] * .7152 + c[2] * .0722;
};
const light = harness('light'), paper = luminance(light.api.renderTheme().tileBottom);
for (const key of Object.keys(CATEGORIES)) {
  const ink = luminance(light.api.categoryColor(key));
  assert((paper + .05) / (ink + .05) >= 4.5, `Light tile category contrast: ${key}`);
}
console.log('PASS: inline syntax; default/persisted/invalid/blocked storage; exclusive button states; no redundant refresh; 10 light category colors meet 4.5:1 against the tile base.');
