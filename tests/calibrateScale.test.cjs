const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const { parse, compileTemplate } = require("@vue/compiler-sfc");
const { transformSync } = require("@babel/core");

const filename = path.resolve(__dirname, "../src/components/calibrateScale.vue");
const { descriptor } = parse(readFileSync(filename, "utf8"));
const { code } = transformSync(descriptor.script.content, {
  configFile: false,
  babelrc: false,
  plugins: [require.resolve("@babel/plugin-transform-modules-commonjs")],
});

function socket() {
  const listeners = new Map();
  return {
    connected: true,
    sent: [],
    listeners,
    emit(event, data) { this.sent.push({ event, data }); },
    on(event, fn) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(fn);
    },
    off(event, fn) { listeners.get(event)?.delete(fn); },
    receive(event, data) { for (const fn of listeners.get(event) || []) fn(data); },
  };
}

// Exercise the actual SFC methods with fake transport and clock: no hardware I/O.
function fixture(initialSocket = socket()) {
  const timers = new Map();
  const posts = [];
  let timerId = 0;
  let rejectHistory = false;
  const context = {
    exports: {},
    require(name) {
      if (name === "axios") return { post(url, data) {
        posts.push({ url, data });
        return rejectHistory ? Promise.reject(new Error("unavailable")) : Promise.resolve();
      } };
      if (name === "@/config") return { url: () => "http://debug", url_port: () => "3002" };
      if (name === "vuex") return { mapState: () => ({}) };
      throw new Error(`Unexpected import: ${name}`);
    },
    setTimeout(fn) { timers.set(++timerId, fn); return timerId; },
    clearTimeout(id) { timers.delete(id); },
  };
  vm.runInNewContext(code, context, { filename });
  const options = context.exports.default;
  const ui = { ...options.data(), socket_instance: initialSocket };
  for (const [key, fn] of Object.entries(options.methods)) ui[key] = fn.bind(ui);
  for (const [key, get] of Object.entries(options.computed)) {
    Object.defineProperty(ui, key, { get: get.bind(ui) });
  }
  options.watch.socket_instance.handler.call(ui, initialSocket, null);
  ui.setScale("weight");
  return {
    ui, posts, timers,
    rejectHistory() { rejectHistory = true; },
    replaceSocket(next) {
      const previous = ui.socket_instance;
      ui.socket_instance = next;
      options.watch.socket_instance.handler.call(ui, next, previous);
    },
    unmount() { options.beforeUnmount.call(ui); },
    timeout() { for (const fn of [...timers.values()]) fn(); },
    ack() { ui._onCalibAck({ ...ui.pending }); },
  };
}

test("template compiles with persistent error and no blocking spinner modal", () => {
  const result = compileTemplate({ source: descriptor.template.content, filename, id: "test-calibration" });
  assert.deepEqual(result.errors, []);
  assert.match(descriptor.template.content, /role="alert"/);
  assert.doesNotMatch(descriptor.template.content, /request-modal/);
});

test("blocked step 1 shows correlated backend error and clears pending state", () => {
  const f = fixture();
  f.ui.nextStep();
  const request = { ...f.ui.pending };
  assert.ok(request.request_id);
  f.ui.socket_instance.receive("calibration_error", { ...request, error: "Calibration blocked: status map not verified" });
  assert.match(f.ui.error, /Calibration blocked/);
  assert.equal(f.ui.busy, false);
  assert.equal(f.ui.failed, true);
  assert.equal(f.ui.step, 0);
  assert.equal(f.timers.size, 0);
  f.ui.nextStep();
  assert.equal(f.ui.socket_instance.sent.filter(x => x.event === "calibrate_load_cell").length, 1);
});

test("uncorrelated, wrong-scale, wrong-step and legacy replies do not advance", () => {
  const { ui } = fixture();
  ui.nextStep();
  const request = { ...ui.pending };
  for (const reply of [undefined, {}, { ...request, request_id: "old" }, { ...request, args: "belly" }, { ...request, step: 3 }]) {
    ui._onCalibAck(reply);
    ui._onCalibError(reply);
  }
  assert.equal(ui.step, 0);
  assert.equal(ui.busy, true);
  ui._onCalibAck(request);
  ui._onCalibAck(request);
  assert.equal(ui.step, 1);
});

test("double click sends only once; each subsequent operation gets a new ID", () => {
  const f = fixture();
  f.ui.nextStep();
  const first = f.ui.pending.request_id;
  f.ui.nextStep();
  assert.equal(f.ui.socket_instance.sent.length, 1);
  f.ack();
  f.ui.nextStep();
  assert.notEqual(f.ui.pending.request_id, first);
});

test("completion and history occur only after matching save ACK", () => {
  const f = fixture();
  for (let step = 1; step <= 3; step++) { f.ui.nextStep(); f.ack(); }
  assert.equal(f.ui.step, 3);
  assert.match(f.ui.step_info.message, /select Save/);
  assert.equal(f.posts.length, 0);
  f.ui.nextStep();
  const save = { ...f.ui.pending };
  assert.equal(f.posts.length, 0);
  f.ack();
  f.ui._onCalibAck(save);
  assert.equal(f.ui.step, 4);
  assert.match(f.ui.step_info.message, /saved and verified/);
  assert.equal(f.posts.length, 1);
  assert.equal(f.ui.sessionActive, false);
  assert.equal(f.timers.size, 0);
});

test("history failure is distinguished from a failed transmitter save", async () => {
  const f = fixture();
  f.rejectHistory();
  for (let step = 1; step <= 4; step++) { f.ui.nextStep(); f.ack(); }
  await Promise.resolve();
  assert.match(f.ui.historyError, /saved on the transmitter/);
  assert.equal(f.ui.step, 4);
  assert.equal(f.ui.error, "");
});

test("timeout stops spinner, releases session and forbids automatic replay", () => {
  const f = fixture();
  f.ui.nextStep();
  const request = { ...f.ui.pending };
  f.timeout();
  assert.equal(f.ui.busy, false);
  assert.equal(f.ui.outcomeUnknown, true);
  assert.equal(f.ui.socket_instance.sent.at(-1).event, "resume_net_update");
  f.ui.nextStep();
  f.ui.cancel();
  f.ui.openModal();
  assert.equal(f.ui.choose_scale, false);
  f.ui._onCalibAck(request);
  assert.equal(f.ui.step, 0);
  assert.equal(f.ui.outcomeUnknown, false);
  assert.equal(f.posts.length, 0);
});

test("cancel during operation keeps uncertain outcome; late error never advances", () => {
  const f = fixture();
  f.ui.nextStep();
  const request = { ...f.ui.pending };
  f.ui.cancel();
  assert.equal(f.ui.calibrate_dialog, false);
  assert.equal(f.ui.outcomeUnknown, true);
  assert.equal(f.timers.size, 0);
  f.ui._onCalibError({ ...request, error: "Operation interrupted" });
  assert.equal(f.ui.outcomeUnknown, false);
  assert.equal(f.ui.step, 0);
});

test("disconnect invalidates pending operation without buffering commands", () => {
  const f = fixture();
  f.ui.nextStep();
  const s = f.ui.socket_instance;
  s.connected = false;
  s.receive("disconnect");
  assert.equal(f.ui.busy, false);
  assert.equal(f.ui.outcomeUnknown, true);
  assert.equal(s.sent.length, 1);
  s.connected = true;
  f.ui.nextStep();
  assert.equal(s.sent.length, 1);
});

test("initially disconnected socket cannot enqueue calibration", () => {
  const s = socket();
  s.connected = false;
  const f = fixture(s);
  f.ui.nextStep();
  assert.equal(s.sent.length, 0);
  assert.match(f.ui.error, /Not connected/);
  assert.equal(f.timers.size, 0);
});

test("late initialization and replacement bind and remove all event listeners", () => {
  const f = fixture(null);
  const first = socket();
  f.replaceSocket(first);
  f.ui.nextStep();
  const next = socket();
  f.replaceSocket(next);
  assert.equal(f.ui.failed, true);
  assert.equal(f.ui.outcomeUnknown, true);
  assert.equal(first.sent.at(-1).event, "resume_net_update");
  for (const listeners of first.listeners.values()) assert.equal(listeners.size, 0);
  for (const listeners of next.listeners.values()) assert.equal(listeners.size, 1);
  assert.equal(next.sent.length, 0);
});

test("expiry affects only an active local session and prevents continuation", () => {
  const f = fixture();
  f.ui._onCalibExpired();
  assert.equal(f.ui.failed, false);
  f.ui.nextStep();
  f.ack();
  f.ui._onCalibExpired();
  assert.equal(f.ui.failed, true);
  assert.equal(f.ui.outcomeUnknown, false);
  assert.match(f.ui.error, /expired/);
});

test("unmount removes listeners, timer and releases active session", () => {
  const f = fixture();
  f.ui.nextStep();
  f.unmount();
  assert.equal(f.timers.size, 0);
  assert.equal(f.ui.socket_instance.sent.at(-1).event, "resume_net_update");
  for (const listeners of f.ui.socket_instance.listeners.values()) assert.equal(listeners.size, 0);
});

test("a failed writing step warns that cancellation is not rollback", () => {
  const f = fixture();
  f.ui.nextStep();
  f.ack();
  f.ui.nextStep();
  f.ui._onCalibError({ ...f.ui.pending, error: "zero verification failed" });
  assert.match(f.ui.error, /Applied changes are not undone/);
  assert.equal(f.ui.failed, true);
});

test("closing a failed session allows an explicit new session and ignores old ACK", () => {
  const f = fixture();
  f.ui.nextStep();
  const old = { ...f.ui.pending };
  f.ui._onCalibError({ ...old, error: "blocked" });
  f.ui.cancel();
  f.ui.openModal();
  f.ui.setScale("belly");
  f.ui.nextStep();
  f.ui._onCalibAck(old);
  assert.equal(f.ui.step, 0);
  assert.equal(f.ui.pending.args, "belly");
  assert.equal(f.ui.failed, false);
});
