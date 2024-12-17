<template>
  <div>
    <v-dialog persistent v-model="choose_scale" max-width="450px">
      <v-card>
        <v-card-title>
          <span class="headline">Choose load cell</span>
        </v-card-title>
        <v-card-actions class="d-flex justify-center pt-3 pb-9">
          <v-card
            @click="setScale('belly')"
            hover
            width="180px"
            class="weight-cards elevation-3 mr-5"
            height="200px"
          >
            <v-icon size="40">mdi-hook</v-icon>
            Belly Resistance
          </v-card>
          <v-card
            @click="setScale('weight')"
            hover
            width="180px"
            class="weight-cards elevation-3"
            height="200px"
          >
            <v-icon size="40">mdi-weight-gram</v-icon>

            Fish Weight
          </v-card>
        </v-card-actions>
        <v-btn color="red" text @click="cancel()"> Cancel </v-btn>
      </v-card>
    </v-dialog>

    <v-dialog v-model="calibrate_dialog" persistent max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">{{ step_info.message }}</span>
        </v-card-title>
        <v-card-actions>
          <v-btn color="red" text @click="cancel()"> Cancel </v-btn>
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
      <v-icon class="mr-1">mdi-weight-gram</v-icon>
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
    choose_scale: false,
    step: 0,
    args: 0,
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
      console.log(this.step);
      const url = `${this.url}:${this.url_port}`;
      this.$refs.loadingModal.open();
      this.socket_instance.emit("calibrate_load_cell", {
        step: this.step + 1,
        args: this.args,
      });
      this.responseTimeOut = setTimeout(() => {
        this.$refs.loadingModal.fail();
      }, 10000);
    },
    nextStep() {
      //   this.step++;
      this.sendRequest();
    },
    openModal() {
      // this.calibrate_dialog = true;
      this.choose_scale = true;
      this.socket_instance.emit("pause_net_update", true);
    },
    setScale(scale) {
      this.choose_scale = false;
      this.calibrate_dialog = true;
      this.step_info = this.calibration_steps[0];

      this.args = scale;
    },
    cancel() {
      this.step = 0;
      this.choose_scale = false;
      this.calibrate_dialog = false;
    },
    resetModal() {
      this.step = 0;
      this.calibrate_dialog = false;
      this.socket_instance.emit("resume_net_update", true);
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

<style lang="scss" scoped>
.weight-cards{
  width: 180px;
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
</style>
