import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

function fixture() {
  const hooks = [];
  let cursor = 0;
  let effects = [];
  let created = 0;
  let removed = 0;
  const centers = [];
  const markers = [];
  const events = {};
  let tileOptions;
  const map = {
    setView(position) { centers.push(position); return this; },
    panTo(position) { centers.push(position); },
    remove() { removed++; },
  };
  const marker = {
    addTo() { return this; }, bindTooltip() { return this; },
    setLatLng(position) { markers.push(position); },
  };
  const react = {
    useRef(value) { const index = cursor++; return hooks[index] ??= { current: value }; },
    useState(value) {
      const index = cursor++;
      hooks[index] ??= { value };
      return [hooks[index].value, (next) => { hooks[index].value = next; }];
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!hooks[index] || deps.some((value, i) => value !== hooks[index].deps[i])) {
        effects.push(() => {
          hooks[index]?.cleanup?.();
          hooks[index] = { deps, cleanup: effect() };
        });
      }
    },
  };
  const { default: Component } = loadTs("components/CustomerLiveMap.tsx", {
    react,
    "leaflet/dist/leaflet.css": {},
    "lucide-react": { MapPin: "map-pin" },
    leaflet: {
      map() { created++; return map; },
      circleMarker(position) { markers.push(position); return marker; },
      tileLayer(url, options) {
        assert.match(url, /^https:\/\//);
        tileOptions = options;
        return {
          on(event, callback) { events[event] = callback; return this; },
          addTo() { return this; },
        };
      },
    },
  });
  async function render(lat, lng) {
    cursor = 0;
    const tree = Component({ location: { lat, lng, updatedAt: new Date().toISOString() } });
    // Attach the map container before React's effects run.
    hooks[0].current ??= {};
    for (const effect of effects) effect();
    effects = [];
    await new Promise((resolve) => setImmediate(resolve));
    return tree;
  }
  return {
    render, events, centers, markers,
    get created() { return created; },
    get removed() { return removed; },
    get tileOptions() { return tileOptions; },
    unmount() { for (const hook of hooks) hook?.cleanup?.(); },
  };
}

test("live map initializes without Google, follows GPS updates, and removes its map on unmount", async () => {
  const f = fixture();
  const tree = await f.render(-37.8, 144.9);
  assert.equal(f.created, 1);
  assert.equal(f.tileOptions.referrerPolicy, "strict-origin");
  assert.match(f.tileOptions.attribution, /OpenStreetMap/);
  assert.match(tree.props.children[1].props.href, /mlat=-37.8&mlon=144.9/);
  await f.render(-37.9, 145);
  assert.equal(f.created, 1);
  assert.deepEqual([...f.centers.at(-1)], [-37.9, 145]);
  assert.deepEqual([...f.markers.at(-1)], [-37.9, 145]);
  // Tile failures must still be handled after GPS coordinates change.
  f.events.tileerror();
  const failed = await f.render(-37.9, 145);
  assert.equal(failed.props.children[0].props.children[1].props.role, "status");
  f.events.tileload();
  const recovered = await f.render(-37.9, 145);
  assert.equal(recovered.props.children[0].props.children[1], false);
  f.unmount();
  assert.equal(f.removed, 1);
});

test("unmounting during the Leaflet import does not create a map", async () => {
  const f = fixture();
  const pending = f.render(-37.8, 144.9);
  f.unmount();
  await pending;
  assert.equal(f.created, 0);
});
