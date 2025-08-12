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
          <v-btn
            :disabled="busy"
            :loading="busy"
            :color="step < 3 ? 'primary' : 'green'"
            text
            @click="nextStep"
          >
            {{ step === 3 ? "Save" : "Next" }}
            <v-icon right>
              {{ `mdi-${step === 3 ? "check" : "arrow-right"}` }}
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
import { mapState } from "vuex";
import requestModal from "./requestModal.vue";

export default {
  name: "calibrateScale",
  components: { requestModal },
  data: () => ({
    calibrate_dialog: false,
    choose_scale: false,
    step: 0,
    args: null, // "belly" | "weight"
    responseTimeOut: null,
    busy: false,
    step_info: { message: "", icon: "" },
  }),
  computed: {
    ...mapState(["socket_instance"]),
    calibration_steps: () => [
      { message: "Click next to start calibration", icon: "mdi-weight-gram" },
      { message: "Place the empty container on the scale and press OK", icon: "mdi-weight-gram" },
      { message: "Place the container with the weight on the scale and press OK", icon: "mdi-weight-gram" },
      { message: "Calibration complete", icon: "mdi-check" },
    ],
  },
  methods: {
    openModal() {
      this.choose_scale = true;
      // No emit de "pause_net_update": no existe en tu server y no lo tocaremos
    },
    setScale(scale) {
      this.args = scale; // "belly" o "weight"
      this.step = 0;
      this.step_info = this.calibration_steps[0];
      this.choose_scale = false;
      this.calibrate_dialog = true;
    },
    nextStep() {
      // Envía el paso actual + 1 (server espera 1..4)
      if (!this.socket_instance) return;
      if (this.args !== "belly" && this.args !== "weight") return;

      this.busy = true;
      this.$refs.loadingModal.open();

      this.socket_instance.emit("calibrate_load_cell", {
        step: this.step + 1,
        args: this.args,
      });

      clearTimeout(this.responseTimeOut);
      this.responseTimeOut = setTimeout(() => {
        this.$refs.loadingModal.fail();
        this.busy = false;
      }, 10000);
    },
    cancel() {
      // Cierra y garantiza salir de modo calibración en el server
      this.step = 0;
      this.choose_scale = false;
      this.calibrate_dialog = false;
      this.busy = false;
      clearTimeout(this.responseTimeOut);
      if (this.socket_instance) {
        this.socket_instance.emit("resume_net_update"); // tu server la soporta
      }
      this.$refs.loadingModal?.close?.();
    },
    resetModal() {
      this.step = 0;
      this.calibrate_dialog = false;
      this.busy = false;
      if (this.socket_instance) {
        this.socket_instance.emit("resume_net_update");
      }
    },
    _onCalibAck() {
      clearTimeout(this.responseTimeOut);
      this.$refs.loadingModal.close();
      this.busy = false;

      this.step++;
      if (this.step >= 4) {
        // terminado
        this.resetModal();
      } else {
        this.step_info = this.calibration_steps[this.step];
      }
    },
  },
  watch: {
    step(newStep) {
      this.step_info = this.calibration_steps[newStep];
    },
  },
  mounted() {
    this.step_info = this.calibration_steps[0];

    if (this.socket_instance) {
      this.socket_instance.on("calibration_step_commited", this._onCalibAck);
    }
  },
  unmounted() { // Vue 3
    if (this.socket_instance) {
      this.socket_instance.off("calibration_step_commited", this._onCalibAck);
    }
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
