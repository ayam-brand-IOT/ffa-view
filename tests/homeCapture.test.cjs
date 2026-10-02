const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const { parse } = require("@vue/compiler-sfc");
const { transformSync } = require("@babel/core");

const filename = path.resolve(__dirname, "../src/views/HomeView.vue");
const { descriptor } = parse(readFileSync(filename, "utf8"));
const { code } = transformSync(descriptor.script.content, {
  configFile: false,
  babelrc: false,
  plugins: [require.resolve("@babel/plugin-transform-modules-commonjs")],
});

function socket() {
  const listeners = new Map();
  return {
    sent: [],
    emit(event, data) { this.sent.push(event); },
    on(event, fn) { listeners.set(event, [...(listeners.get(event) || []), fn]); },
    off(event, fn) {
      listeners.set(event, fn ? (listeners.get(event) || []).filter((x) => x !== fn) : []);
    },
    receive(event, data) { for (const fn of listeners.get(event) || []) fn(data); },
  };
}

// Only the capture decision is exercised: Vue, the DOM and network are stubbed.
function fixture() {
  const timers = new Map();
  let timerId = 0;
  const context = {
    exports: {},
    console,
    window: { addEventListener() {}, removeEventListener() {} },
    require(name) {
      if (name === "axios") return {};
      if (name === "../config") return { defects: {}, actions: {}, url: () => "", url_server: () => "" };
      if (name === "vuex") return { mapState: () => ({}), mapGetters: () => ({}) };
      return {};
    },
    setTimeout(fn) { timers.set(++timerId, fn); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    setInterval() { throw new Error("HomeView must not poll update_net"); },
  };
  vm.runInNewContext(code, context, { filename });
  const options = context.exports.default;
  const io = socket();
  const ui = { ...options.data.call({}), socket_instance: io, notes: [], $refs: {} };
  for (const [key, fn] of Object.entries(options.methods)) ui[key] = fn.bind(ui);
  ui.notify = (message, type) => ui.notes.push({ message, type });
  ui.putData = () => {};
  ui.resetLive = () => {};
  options.mounted.call(ui);
  return { ui, io, timers, options };
}

const status = (value, ready, readyValue = ready ? value : null) => ({
  value, stable: ready, ok: true, faults: [], ready, ready_value: readyValue,
});

test("capture waits for the confirmed weight and stores that value", () => {
  const { ui, io } = fixture();
  ui.evokeAction("CAPTURE");
  io.receive("weight_update", 980);
  io.receive("scale_status", status(980, false));
  assert.equal(ui.debounceRequested, true);
  io.receive("weight_update", 1000);
  io.receive("scale_status", status(1000, true));
  assert.equal(ui.debounceRequested, false);
  assert.equal(ui.captured.weight, 1000);
});

test("a newer weight_update never pairs with the previous stable status", () => {
  const { ui, io, options } = fixture();
  // The race came from a live.weight watcher deciding with the old status.
  assert.equal(options.watch?.["live.weight"], undefined);
  io.receive("scale_status", status(1000, true));
  ui.analyzed_image = null;
  // Operator removes and replaces the load: the stale status said ready.
  io.receive("scale_status", status(1000, false));
  ui.evokeAction("CAPTURE");
  io.receive("weight_update", 980);
  assert.equal(ui.debounceRequested, true);
  assert.equal(ui.captured.weight, 0);
});

test("ready value wins over a live weight that arrived separately", () => {
  const { ui, io } = fixture();
  io.receive("weight_update", 980);
  io.receive("scale_status", status(1000, true));
  ui.evokeAction("CAPTURE");
  assert.equal(ui.captured.weight, 1000);
});

test("faults and lost link abort instead of capturing", () => {
  const { ui, io } = fixture();
  ui.evokeAction("CAPTURE");
  io.receive("scale_status", { ...status(1000, true), faults: ["ADC_FAILURE"] });
  assert.equal(ui.debounceRequested, false);
  assert.equal(ui.captured.weight, 0);
  assert.match(ui.notes.at(-1).message, /Scale fault/);
});

test("capture screen arms the beep, re-arms on reconnect and disarms on leave", () => {
  const { ui, io, options } = fixture();
  assert.deepEqual(io.sent.filter((e) => e.endsWith("ready_beep")), ["arm_ready_beep"]);
  io.receive("connect");
  assert.equal(io.sent.filter((e) => e === "arm_ready_beep").length, 2);
  options.beforeUnmount.call(ui);
  assert.equal(io.sent.at(-1), "disarm_ready_beep");
  io.receive("connect");
  assert.equal(io.sent.filter((e) => e === "arm_ready_beep").length, 2);
});
