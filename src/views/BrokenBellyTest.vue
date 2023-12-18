<template>
  <v-container style="height: 100%">
    <!-- <div>
      <h1>Configuration</h1>
    </div> -->
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
    <commandList :commands-list="getCommands" />
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

export default {
  name: "BrokenBellyTest",
  components: {
    Line,
    requestModal,
    commandList,
    notification: pushNotification,
  },
  computed: {
    ...mapState(["socket_instance"]),
    ...mapGetters(["getAnalyzingLotNo"]),
    url_port: () => config.url_port(),
    url: () => config.url(),
    getCommands() {
      return this.actions;
    },
  },
  data: () => ({
    force_data: [],
    time_data: [],
    initial_tension: 0,
    start_time: 0,
    duration: 0,
    break_point: 0,
    labels: [],
    data: [],
    testIsRunning: false,
    optionsAvailable: false,
    actions: {
      " ": { name: "START", description: "Start test", shortcut: "space" },
      h: { name: "HOME", description: "Go to home", shortcut: "h" },
      s: { name: "SAVE", description: "Save test", shortcut: "s" },
      c: { name: "CLEAR", description: "Reset test", shortcut: "c" },
      t: { name: "TARE", description: "Tare", shortcut: "t" },
    },
  }),
  methods: {
    evokeAction(action) {
      switch (action) {
        case "HOME":
          this.$router.push("/");
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
        console.warn("action", index);
        this.evokeAction(index);
      }
    },

    setTare() {
      this.notify("Tare command sent", "success");
      this.socket_instance.emit("set_tare", true);
    },

    updateTension() {
      const { socket_instance } = this;
      socket_instance.emit("get_tension", "");
    },

    run_test() {
      const { testIsRunning } = this;

      if (testIsRunning) this.stopTest();
      else this.startTest();
    },

    notify(text, type, time) {
      this.$refs.notification.push(text, type, time);
    },

    startTest() {
      this.notify("Test started", "info");

      this.resetValues();
      this.testIsRunning = true;
      this.interval = setInterval(this.updateTension, 50);

      this.testTimeout = setTimeout(() => {
        this.notify("Test finished: timeout", "error", 1000);
        this.testFinished();
      }, 10000);
    },

    resetValues() {
      this.duration = 0;
      this.break_point = 0;
      this.time_data = [];
      this.force_data = [];
    },

    resetTest() {
      this.optionsAvailable = false;

      this.resetValues();
      this.updateChart();
    },

    stopTest() {
      // const { socket_instance } = this;

      // socket_instance.emit("enter_to_weight_mode", "");

      if (this.interval) clearInterval(this.interval);
      if (this.testTimeout) clearTimeout(this.testTimeout);

      this.resetValues();
      this.testIsRunning = false;
    },

    updateChart() {
      this.data = this.force_data;
      this.labels = this.time_data;

      this.$refs.ntm.update();
    },

    testFinished() {
      const { socket_instance, force_data, start_time } = this;

      // socket_instance.emit("enter_to_weight_mode", "");
      if (this.interval) clearInterval(this.interval);
      if (this.testTimeout) clearTimeout(this.testTimeout);

      this.testIsRunning = false;

      this.optionsAvailable = true;
      this.break_point = Math.max(...force_data);
      this.duration = new Date().getTime() - start_time;

      this.updateChart();

      console.warn("duration", this.duration);
      console.warn("break_point", this.break_point);
      console.warn("force_data", force_data.length);
    },

    saveData() {
      const { break_point, getAnalyzingLotNo } = this;

      const url = `${this.url}${this.url_port}/add-lot-tension`;
      const data = { break_point, lot_no: getAnalyzingLotNo };
      // const data = { break_point:666, lot_no: "Hugo" };

      this.$refs.loadingModal.open();
      axios
        .post(url, data, {
          headers: { Accept: "application/json" },
        })
        .then(
          (response) => {
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

    socket_instance.on("tension_update", (tension) => {
      const tolerance = 10;
      const { initial_tension, force_data, testIsRunning } = this;

      if (this.force_data.length == 0 && testIsRunning) {
        this.testIsRunning = true;
        this.optionsAvailable = false;
        this.initial_tension = tension;
        // Stating a timer from the first tension update
        this.start_time = new Date().getTime();
      }

      console.log({ tension, initial_tension });

      this.force_data.push(tension);
      this.time_data.push(new Date().getTime() - this.start_time);

      const between_tolerance =
        Math.abs(tension - initial_tension) <= tolerance;
      const is_smaller_than_before =
        force_data[force_data.length - 2] > force_data[force_data.length - 1];

      if (force_data.length > 2) {
        if (between_tolerance && is_smaller_than_before) {
          this.notify("Test finished: tension drop", "success", 1000);
          this.testFinished();
        }
      }
    });
  },

  beforeUnmount() {
    window.removeEventListener("keyup", this.keyboardCatch);
    this.socket_instance.off("tension_update");
  },
};
</script>
<style lang="scss" scoped></style>
