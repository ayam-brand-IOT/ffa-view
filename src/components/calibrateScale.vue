<template>
  <div>
    <v-dialog persistent v-model="calibrate_dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">{{ step_info.message }}</span>
        </v-card-title>
        <v-card-actions>
          <v-btn color="red" text @click="cancel"> Cancel </v-btn>
          <v-spacer></v-spacer>
          <v-btn :color="step < 3 ? 'primary' : 'green'" text @click="nextStep">
            {{ step == 3 ? "Save" : "Next" }}
            <v-icon right>
              {{ `mdi-${step == 3 ? "check" : "arrow-right"}` }}
            </v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <request-modal ref="loadingModal" />
    <v-btn @click="openModal" color="primary" class="buttons">
      <v-icon>mdi-weight-gram</v-icon>
      Calibrate
    </v-btn>
  </div>
</template>
<script>
import axios from "axios";
import config from "@/config";
import { mapState } from "vuex";
import requestModal from "./requestModal.vue";

export default {
  name: "calibrateScale",
  components: {
    requestModal,
  },
  data: () => ({
    calibrate_dialog: false,
    step: 0,
    responseTimeOut: null,
    step_info: {
      message: "",
      icon: "",
    },
  }),
  computed: {
    ...mapState(["socket_instance"]),
    url_port: () => config.url_port(),
    url: () => config.url(),
    calibration_steps: () => [
      {
        message: "Click next to start calibration",
        icon: "mdi-weight-gram",
      },
      {
        message: "Place the empty container on the scale and press OK",
        icon: "mdi-weight-gram",
      },
      {
        message:
          "Place the container with the weight on the scale and press OK",
        icon: "mdi-weight-gram",
      },
      {
        message: "Calibration complete",
        icon: "mdi-check",
      },
    ],
  },
  methods: {
    sendRequest() {
      const url = `${this.url}${this.url_port}`;
      this.$refs.loadingModal.open();
      this.socket_instance.emit("calibrate_load_cell", { step: this.step + 1, args: 500000 });
      this.responseTimeOut = setTimeout(() => {
        this.$refs.loadingModal.fail();
      }, 10000);
    },
    nextStep() {
      //   this.step++;
      this.sendRequest();
    },
    openModal() {
      this.calibrate_dialog = true;
      this.socket_instance.emit("pause_net_update", true);
    },
    cancel() {
      this.step = 0;
      this.calibrate_dialog = false;
    },
    resetModal() {
      this.step = 0;
      this.calibrate_dialog = false;
    },
  },
  watch: {
    step: function (newStep) {
      this.step_info = this.calibration_steps[newStep];
      //   if (newStep > 0) this.sendRequest();
    },
  },
  mounted() {
    this.step_info = this.calibration_steps[0];

    this.socket_instance.on("calibration_step_commited", (data) => {
      clearTimeout(this.responseTimeOut);
      this.step++;
      if (this.step == 4) this.resetModal();
      this.$refs.loadingModal.close();
    });
  },
  unmounted() {
    // remove handler from socket
  },
};
</script>
