import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

function fixture(onSave) {
  const hooks = [], timers = new Map(), errors = [];
  let index = 0, timerId = 0, cleanup;
  const react = {
    useState(initial) {
      const slot = index++;
      if (!(slot in hooks)) hooks[slot] = initial;
      return [hooks[slot], value => { hooks[slot] = value; }];
    },
    useRef(initial) {
      const slot = index++;
      if (!(slot in hooks)) hooks[slot] = { current: initial };
      return hooks[slot];
    },
    useEffect(effect) { if (!cleanup) cleanup = effect(); },
  };
  const { QuoteSaveButton } = loadTs("components/admin/QuoteSaveButton.tsx", { react }, {
    Error,
    setTimeout: callback => { timers.set(++timerId, callback); return timerId; },
    clearTimeout: id => timers.delete(id),
  });
  return {
    errors, timers,
    render() { index = 0; return QuoteSaveButton({ onSave, onError: error => errors.push(error) }); },
    unmount() { cleanup(); },
  };
}

test("opening and rerendering the Save button never starts a request", () => {
  let writes = 0;
  const f = fixture(async () => { writes++; });
  for (let i = 0; i < 60; i++) {
    const button = f.render();
    assert.equal(button.props.children, "Save Quote");
    assert.equal(button.props.disabled, false);
  }
  assert.equal(writes, 0);
  assert.equal(f.timers.size, 0);
});

test("only a click starts loading; double clicks send one request and completion restores idle", async () => {
  let finish, writes = 0;
  const f = fixture(() => { writes++; return new Promise(resolve => { finish = resolve; }); });
  const button = f.render();
  const pending = button.props.onClick();
  await button.props.onClick();
  assert.equal(f.render().props.children, "Saving…");
  assert.equal(writes, 1);
  finish();
  await pending;
  assert.equal(f.render().props.children, "Save Quote");
  assert.equal(f.timers.size, 0);
});

test("even a never-ending save stops loading after the 20 second deadline", async () => {
  const f = fixture(() => new Promise(() => {}));
  const pending = f.render().props.onClick();
  for (const timeout of [...f.timers.values()]) timeout();
  await pending;
  assert.equal(f.render().props.disabled, false);
  assert.match(f.errors[0], /Saving took too long/);
});

test("reopening creates an idle button while the old save is pending", async () => {
  let finish;
  const first = fixture(() => new Promise(resolve => { finish = resolve; }));
  const pending = first.render().props.onClick();
  await Promise.resolve();
  first.unmount();
  const next = fixture(async () => {});
  assert.equal(next.render().props.children, "Save Quote");
  finish();
  await pending;
  assert.equal(next.render().props.disabled, false);
  assert.equal(next.errors.length, 0);
});
