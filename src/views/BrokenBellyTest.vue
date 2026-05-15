<template>
  <v-container style="height: 100%">
    <lot-stepper :current-step="2" />
    <!-- <div>
      <h1>Configuration</h1>
    </div> -->

    <div class="d-flex align-baseline mt-2">
      <h4 class="mb-3 ml-4">Last sample #:</h4>
      <span class="ml-1">{{ last_analysed_id }}</span>

      <v-spacer />

      <v-chip :color="stateColor" label class="mr-4">
        {{ stateLabel }}
      </v-chip>
    </div>

    <p class="ml-4 mb-4">
      {{ statusMessage }}
    </p>

    <v-row justify="center">
      <v-col cols="10">
        <v-row>
          <v-col cols="4">
            <h4>Test duration</h4>
            <h2>
              <v-icon>mdi-timer</v-icon>
              {{ duration }}
            </h2>
            segs.
          </v-col>
          <v-col cols="8">
            <h4>Max tension</h4>
            <h2>
              <v-icon>mdi-weight</v-icon>
              {{ break_point }}
            </h2>
            grams.
          </v-col>
          <v-col  cols="12">
            <Line ref="ntm" :labels="labels" :data="data" />
          </v-col>
          <v-col cols="12" class="d-flex">
            <v-btn :color="testIsRunning ? 'red' : 'primary'" @click="run_test">
              {{ testIsRunning ? "Stop" : "Start" }} test
            </v-btn>
            <v-spacer />
            <v-btn
              :disabled="!optionsAvailable"
              @click="resetTest"
              text
              class="mr-3"
              color="error"
              variant="text"
            >
              Reset
            </v-btn>
            <v-btn
              :disabled="!optionsAvailable"
              @click="saveData"
              color="green"
            >
              Save
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Step navigation -->
    <div class="d-flex justify-space-between mt-4 px-4">
      <v-btn variant="text" color="grey" @click="$router.push('/analyse-lot')">
        <v-icon start>mdi-arrow-left</v-icon>
        Back: Samples
      </v-btn>
      <v-btn color="primary" size="x-large" @click="goToGutsWeight">
        Next: Guts Weight
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
    </div>

    <notification ref="notification" />
    <commandList :commands-list="getCommands" ref="commandList" />
    <v-btn
      style="position: absolute; bottom: 55px; right: 15px"
      color="primary"
      icon
      @click="openCommandList"
      title="help btn"
    >
      <v-icon>mdi-help-circle</v-icon>
    </v-btn>
  </v-container>
</template>
<script>
import axios from "axios";
import config from "@/config";
import { mapState, mapGetters } from "vuex";
import Line from "@/components/lineChart.vue";
import commandList from "@/components/commandList.vue";
import pushNotification from "@/components/pushNotification.vue";
import LotStepper from "@/components/LotStepper.vue";

// --- Behaviour parameters ---
const SAMPLE_INTERVAL_MS = 50;      // how often we poll tension
const AUTO_START_THRESHOLD = 30;    // g above baseline to consider pulling has started
const AUTO_START_SAMPLES = 6;       // 6 samples * 50ms = ~300ms sustained rise
const MIN_PEAK_FOR_BREAK = 80;      // minimum g max_tension must reach before looking for break
                                    // avoids false positives during unstable fish placement
const BREAK_DROP_PERCENT = 0.50;    // 50% drop from peak required to consider a break
                                    // (relative: 20g noise on 400g peak = 5% → no trigger)
const BREAK_DESC_SAMPLES = 10;      // 10 * 50ms = 500ms sustained below threshold
const MAX_TEST_MS = 10000;          // safety timeout (10s)

export default {
  name: "BrokenBellyTest",
  components: {
    Line,
    commandList,
    notification: pushNotification,
    LotStepper,
  },
  computed: {
    ...mapState(["socket_instance", "last_analysed_id"]),
    ...mapGetters(["getAnalyzingLotNo"]),
    url_port: () => config.url_port(),
    url: () => config.url(),
    getCommands() {
      return this.actions;
    },
    stateLabel() {
      switch (this.state) {
        case "idle":
          return "Waiting";
        case "arming":
          return "Detecting tension";
        case "running":
          return "Test running";
        case "finished":
          return "Test finished";
        default:
          return this.state;
      }
    },
    stateColor() {
      switch (this.state) {
        case "idle":
          return "grey";
        case "arming":
          return "blue";
        case "running":
          return "orange";
        case "finished":
          return "green";
        default:
          return "grey";
      }
    },
  },
  data: () => ({
    force_data: [],
    time_data: [],
    baseline_tension: null,
    start_time: 0,
    duration: 0,
    break_point: 0,
    labels: [],
    data: [],
    testIsRunning: false,
    optionsAvailable: false,

    monitorInterval: null,
    testTimeout: null,
    state: "idle", // idle | arming | running | finished
    statusMessage: "Hang the fish and start pulling...",
    autoMode: true,

    current_tension: 0,
    max_tension: 0,
    risingSamples: 0,
    descendingSamples: 0,
    last_tension: 0,

    actions: {
      " ": { name: "START", description: "Start test", shortcut: "space" },
      h: { name: "HOME", description: "Go to home", shortcut: "h" },
      s: { name: "SAVE", description: "Save test", shortcut: "s" },
      c: { name: "CLEAR", description: "Reset test", shortcut: "c" },
      t: { name: "TARE", description: "Tare", shortcut: "t" },
    },
    lastChartUpdate: 0,
  }),
  methods: {
    goToGutsWeight() {
      if (this.state === "finished" && this.break_point > 0) {
        this.saveData({ navigateTo: "/guts-weight" });
      } else {
        this.$router.push("/guts-weight");
      }
    },
    evokeAction(action) {
      switch (action) {
        case "HOME":
          this.$router.push("/analyse-lot");
          break;
        case "START":
          this.run_test();
          break;
        case "SAVE":
          if (this.optionsAvailable) this.saveData();
          break;
        case "CLEAR":
          if (this.optionsAvailable) this.resetTest();
          break;
        case "TARE":
          this.setTare();
          break;
      }
    },

    keyboardCatch(event) {
      const { actions } = this;
      const key = event.key.toLowerCase();

      if (actions.hasOwnProperty(key)) {
        const index = actions[key].name;
        event.preventDefault();
        if (index !== "START" && this.testIsRunning) {
          this.notify("Test is running, Stop it to run the command", "warning");
          return;
        }
        this.evokeAction(index);
      }
    },

    openCommandList() {
      this.$refs.commandList.open();
    },

    setTare() {
      this.notify("Tare command sent", "success");
      this.socket_instance.emit("set_tare", true);
      // reset baseline to recalculate with new values
      this.baseline_tension = null;
    },

    updateTension() {
      const { socket_instance } = this;
      socket_instance.emit("get_tension", "");
    },

    // monitor always active
    startMonitoring() {
      if (this.monitorInterval) clearInterval(this.monitorInterval);
      this.monitorInterval = setInterval(
        this.updateTension,
        SAMPLE_INTERVAL_MS
      );
    },

    run_test() {
      // Start/Stop button: manual start or manual stop
      if (this.testIsRunning) {
        this.stopTest("manual-stop");
      } else if (this.state === "finished" && this.break_point > 0) {
        // Guarda la prueba anterior antes de iniciar una nueva.
        this.saveData({ startAfter: true });
      } else {
        this.startTest("manual");
      }
    },

    notify(text, type, time) {
      this.$refs.notification.push(text, type, time);
    },

    startTest(origin = "manual") {
      if (this.testIsRunning) return;

      this.resetValues();
      this.testIsRunning = true;
      this.state = "running";
      this.optionsAvailable = false;

      this.statusMessage =
        origin === "auto"
          ? "Test started automatically — keep pulling until it breaks."
          : "Test started — keep pulling until it breaks.";

      this.notify(
        origin === "auto" ? "Test started (auto)" : "Test started",
        "info"
      );

      this.start_time = new Date().getTime();
      this.max_tension = this.current_tension || 0;
      this.descendingSamples = 0;

      if (this.testTimeout) clearTimeout(this.testTimeout);
      this.testTimeout = setTimeout(() => {
        if (!this.testIsRunning) return;
        this.testFinished("timeout");
      }, MAX_TEST_MS);
    },

    resetValues() {
      this.duration = 0;
      this.break_point = 0;
      this.time_data = [];
      this.force_data = [];
      this.max_tension = 0;
      this.risingSamples = 0;
      this.descendingSamples = 0;
    },

    resetTest() {
      this.optionsAvailable = false;
      this.state = "idle";
      this.statusMessage = "Hang the fish and start pulling...";

      this.resetValues();
      this.updateChart();
    },

    stopTest(reason = "stopped") {
      if (this.interval) clearInterval(this.interval);
      if (this.testTimeout) {
        clearTimeout(this.testTimeout);
        this.testTimeout = null;
      }

      this.testIsRunning = false;
      this.state = "idle";
      this.statusMessage =
        reason === "manual-stop"
          ? "Test stopped. You can try again."
          : "Test stopped.";

      this.resetValues();
      this.updateChart();
    },

    updateChart() {
      const now = performance.now();

      // throttle to at most once every 100ms
      if (now - this.lastChartUpdate < 100) return;
      this.lastChartUpdate = now;

      // clone arrays to avoid stale reference issues
      this.data = [...this.force_data];
      this.labels = [...this.time_data];

      this.$nextTick(() => {
        if (this.$refs.ntm && typeof this.$refs.ntm.update === "function") {
          this.$refs.ntm.update();
        }
      });
    },

    testFinished(reason = "tension drop") {
      if (!this.testIsRunning) return;

      if (this.testTimeout) {
        clearTimeout(this.testTimeout);
        this.testTimeout = null;
      }

      this.testIsRunning = false;
      this.state = "finished";
      this.optionsAvailable = true;

      this.break_point =
        this.max_tension ||
        (this.force_data.length ? Math.max(...this.force_data) : 0);
      this.duration = new Date().getTime() - this.start_time;

      this.updateChart();

      let type =
        reason === "timeout"
          ? "warning"
          : reason === "tension drop"
          ? "success"
          : "info";

      this.statusMessage = `Test finished (${reason}). Max tension: ${this.break_point.toFixed(0)} g.`;

      this.notify(this.statusMessage, type, 2000);

      console.warn("duration", this.duration);
      console.warn("break_point", this.break_point);
      console.warn("force_data", this.force_data.length);
    },

    saveData(options = {}) {
      const { break_point, getAnalyzingLotNo } = this;

      const url = `${this.url}:${this.url_port}/add-lot-tension`;
      const data = {
        break_point,
        lot_no: getAnalyzingLotNo,
        muestra_id: this.last_analysed_id,
      };

      axios
        .post(url, data, { headers: { Accept: "application/json" } })
        .then(
          () => {
            // Brief notification; next action starts as it fades out
            this.notify("Added", "success", 1200);
            this.resetTest();
            if (options.startAfter) {
              setTimeout(() => this.startTest("manual"), 1000);
            } else if (options.navigateTo) {
              setTimeout(() => this.$router.push(options.navigateTo), 1000);
            }
          },
          (error) => {
            console.log(error);
            this.notify("Error saving", "error", 3000);
          }
        );
    },
  },

  mounted() {
    const { socket_instance } = this;

    window.addEventListener("keyup", this.keyboardCatch);
    this.socket_instance.emit("set_tare", true);

    this.statusMessage = "Hang the fish and start pulling...";
    this.startMonitoring();

    socket_instance.on("tension_update", (tension) => {
      this.current_tension = tension;

      // set baseline on start or after tare
      if (this.baseline_tension === null) {
        this.baseline_tension = tension;
      }

      const deltaFromBaseline = tension - this.baseline_tension;
      const isAboveThreshold = deltaFromBaseline > AUTO_START_THRESHOLD;

      // --- AUTO-START: sustained rise ---
      if (this.autoMode && !this.testIsRunning && this.state !== "finished") {
        if (isAboveThreshold) {
          this.risingSamples++;

          if (this.state !== "arming") {
            this.state = "arming";
            this.statusMessage = "Detecting tension — keep pulling...";
          }

          if (this.risingSamples >= AUTO_START_SAMPLES) {
            this.startTest("auto");
          }
        } else {
          this.risingSamples = 0;
          if (this.state === "arming") {
            this.state = "idle";
            this.statusMessage = "Hang the fish and start pulling...";
          }
        }
      }

      // --- If test is running, record data and check for break ---
      if (this.testIsRunning) {
        if (this.force_data.length === 0) {
          this.start_time = new Date().getTime();
        }

        this.force_data.push(tension);
        this.time_data.push(new Date().getTime() - this.start_time);

        // update peak
        if (tension > this.max_tension) {
          this.max_tension = tension;
        }

        // Break detection: percentage-based drop + minimum peak threshold.
        // - Only look for break after max_tension reaches MIN_PEAK_FOR_BREAK,
        //   so unstable placement noise does not trigger a false positive.
        // - % drop vs fixed delta: 20g noise on 400g peak = 5% → no trigger.
        const dropFromMax = this.max_tension - tension;
        const dropPercent = this.max_tension > 0 ? dropFromMax / this.max_tension : 0;
        if (this.max_tension >= MIN_PEAK_FOR_BREAK && dropPercent >= BREAK_DROP_PERCENT) {
          this.descendingSamples++;
        } else {
          this.descendingSamples = 0;
        }

        if (
          this.force_data.length > 5 &&
          this.descendingSamples >= BREAK_DESC_SAMPLES
        ) {
          this.testFinished("tension drop");
        }

        this.updateChart();
      }

      this.last_tension = tension;
    });
  },

  beforeUnmount() {
    window.removeEventListener("keyup", this.keyboardCatch);
    this.socket_instance.off("tension_update");
    if (this.monitorInterval) clearInterval(this.monitorInterval);
    if (this.testTimeout) clearTimeout(this.testTimeout);
  },
};
</script>

<style lang="scss" scoped></style>
