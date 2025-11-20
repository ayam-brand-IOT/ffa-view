<template>
  <v-container style="height: 100%">
    <!-- <div>
      <h1>Configuration</h1>
    </div> -->

    <div class="d-flex align-baseline">
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

    <v-row style="height: 100%" justify="center">
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
          <v-col cols="12">
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
    <request-modal ref="loadingModal" />
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
import requestModal from "@/components/requestModal.vue";
import pushNotification from "@/components/pushNotification.vue";

// --- Parámetros de comportamiento (ajústalos en pruebas reales) ---
const SAMPLE_INTERVAL_MS = 50; // cada cuánto pedimos tensión
const AUTO_START_THRESHOLD = 30; // g por encima de la línea base para considerar que ya se está jalando
const AUTO_START_SAMPLES = 6; // 6 samples * 50ms = ~300 ms de subida sostenida
const BREAK_DROP_DELTA = 20; // caída respecto al máximo para decir que "se rompió"
const BREAK_DESC_SAMPLES = 4; // cuántos samples bajando después del pico
const MAX_TEST_MS = 10000; // timeout de seguridad de la prueba (10s)

export default {
  name: "BrokenBellyTest",
  components: {
    Line,
    requestModal,
    commandList,
    notification: pushNotification,
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
          return "Esperando";
        case "arming":
          return "Detectando tensión";
        case "running":
          return "Prueba en curso";
        case "finished":
          return "Prueba terminada";
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

    // nuevo
    monitorInterval: null,
    testTimeout: null,
    state: "idle", // idle | arming | running | finished
    statusMessage: "Esperando que cuelgues el pescado y empieces a jalar...",
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
      // reseteamos baseline para recalcular con nuevos valores
      this.baseline_tension = null;
    },

    updateTension() {
      const { socket_instance } = this;
      socket_instance.emit("get_tension", "");
    },

    // monitor siempre activo
    startMonitoring() {
      if (this.monitorInterval) clearInterval(this.monitorInterval);
      this.monitorInterval = setInterval(
        this.updateTension,
        SAMPLE_INTERVAL_MS
      );
    },

    run_test() {
      // botón Start/Stop: inicio manual o parada manual
      if (this.testIsRunning) this.stopTest("manual-stop");
      else this.startTest("manual");
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
          ? "Prueba iniciada automáticamente, sigue jalando hasta que se rompa."
          : "Prueba iniciada, sigue jalando hasta que se rompa.";

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
      this.statusMessage =
        "Esperando que cuelgues el pescado y empieces a jalar...";

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
          ? "Prueba detenida. Puedes volver a intentarlo."
          : "Prueba detenida.";

      this.resetValues();
      this.updateChart();
    },

    updateChart() {
      const now = performance.now();

      // no actualices más de 1 vez cada 100ms
      if (now - this.lastChartUpdate < 100) return;
      this.lastChartUpdate = now;

      // clonar arrays para evitar efectos raros de referencia
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

      this.statusMessage = `Prueba terminada (${reason}). Máxima tensión: ${this.break_point.toFixed(
        0
      )} g.`;

      this.notify(this.statusMessage, type, 2000);

      console.warn("duration", this.duration);
      console.warn("break_point", this.break_point);
      console.warn("force_data", this.force_data.length);
    },

    saveData() {
      const { break_point, getAnalyzingLotNo } = this;

      const url = `${this.url}:${this.url_port}/add-lot-tension`;
      const data = {
        break_point,
        lot_no: getAnalyzingLotNo,
        muestra_id: this.last_analysed_id,
      };

      this.$refs.loadingModal.open();
      axios
        .post(url, data, {
          headers: { Accept: "application/json" },
        })
        .then(
          () => {
            this.$refs.loadingModal.success();
            this.resetTest();
          },
          (error) => {
            console.log(error);
            this.$refs.loadingModal.fail();
          }
        );
    },
  },

  mounted() {
    const { socket_instance } = this;

    window.addEventListener("keyup", this.keyboardCatch);
    this.socket_instance.emit("set_tare", true);

    this.statusMessage =
      "Esperando que cuelgues el pescado y empieces a jalar...";
    this.startMonitoring(); // <<--- aquí empieza a leer SIEMPRE

    socket_instance.on("tension_update", (tension) => {
      this.current_tension = tension;

      // baseline al principio o después de tare
      if (this.baseline_tension === null) {
        this.baseline_tension = tension;
      }

      const deltaFromBaseline = tension - this.baseline_tension;
      const isAboveThreshold = deltaFromBaseline > AUTO_START_THRESHOLD;

      // --- AUTO-START: subida sostenida ---
      if (this.autoMode && !this.testIsRunning && this.state !== "finished") {
        if (isAboveThreshold) {
          this.risingSamples++;

          if (this.state !== "arming") {
            this.state = "arming";
            this.statusMessage = "Detectando tensión, no sueltes...";
          }

          if (this.risingSamples >= AUTO_START_SAMPLES) {
            this.startTest("auto");
          }
        } else {
          this.risingSamples = 0;
          if (this.state === "arming") {
            this.state = "idle";
            this.statusMessage =
              "Esperando que cuelgues el pescado y empieces a jalar...";
          }
        }
      }

      // --- Si la prueba está corriendo, guardamos los datos y buscamos ruptura ---
      if (this.testIsRunning) {
        if (this.force_data.length === 0) {
          this.start_time = new Date().getTime();
        }

        this.force_data.push(tension);
        this.time_data.push(new Date().getTime() - this.start_time);

        // actualizar máximo
        if (tension > this.max_tension) {
          this.max_tension = tension;
          this.descendingSamples = 0;
        } else {
          // bajando
          if (tension < this.last_tension - 2) {
            this.descendingSamples++;
          } else {
            this.descendingSamples = 0;
          }
        }

        const hasDroppedEnough = this.max_tension - tension >= BREAK_DROP_DELTA;

        if (
          this.force_data.length > 5 &&
          hasDroppedEnough &&
          this.descendingSamples >= BREAK_DESC_SAMPLES
        ) {
          this.testFinished("tension drop");
        }

        // chart en vivo (si te da lag, se puede bajar la frecuencia)
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
