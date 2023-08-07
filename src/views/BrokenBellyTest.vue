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
  </v-container>
</template>
<script>
import axios from "axios";
import config from "@/config";
import { mapState, mapGetters } from "vuex";
import Line from "@/components/lineChart.vue";
import requestModal from "@/components/requestModal.vue";

export default {
  name: "BrokenBellyTest",
  components: {
    Line,
    requestModal,
  },
  computed: {
    ...mapState(["socket_instance"]),
    ...mapGetters(["getAnalyzingLotNo"]),
    url_port: () => config.url_port(),
    url: () => config.url(),
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
  }),
  methods: {
    run_test() {
      const { socket_instance, testIsRunning } = this;
      if (testIsRunning) {
        this.stopTest();
      } else {
        this.resetValues();
        socket_instance.emit("enter_to_tension_test", "");
      }
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
      const { socket_instance } = this;

      socket_instance.emit("enter_to_weight_mode", "");
      this.testIsRunning = false;
      this.resetValues();
    },
    updateChart() {
      this.data = this.force_data;
      this.labels = this.time_data;

      this.$refs.ntm.update();
    },
    testFinished() {
      const { socket_instance, force_data, start_time } = this;

      socket_instance.emit("enter_to_weight_mode", "");

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

    socket_instance.on("tension_update", (tension) => {
      const tolerance = 10;
      const { initial_tension, force_data } = this;

      if (this.force_data.length == 0) {
        this.testIsRunning = true;
        this.optionsAvailable = false;
        this.initial_tension = tension;
        // Stating a timer from the first tension update
        this.start_time = new Date().getTime();
      }

      this.force_data.push(tension);
      this.time_data.push(new Date().getTime() - this.start_time);

      const between_tolerance =
        Math.abs(tension - initial_tension) <= tolerance;
      const is_smaller_than_before =
        force_data[force_data.length - 2] > force_data[force_data.length - 1];

      if (force_data.length > 2) {
        if (between_tolerance && is_smaller_than_before) {
          this.testFinished();
        }
      }
    });
  },
};
</script>
<style lang="scss" scoped></style>
