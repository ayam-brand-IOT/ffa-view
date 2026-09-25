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
        <v-card-title class="calibration-title">
          <span class="headline">{{ failed ? "Calibration stopped" : step_info.message }}</span>
        </v-card-title>
        <v-card-text v-if="error" role="alert">
          <v-alert type="error" variant="tonal">{{ error }}</v-alert>
        </v-card-text>
        <v-card-text v-if="historyError" role="alert">
          <v-alert type="warning" variant="tonal">{{ historyError }}</v-alert>
        </v-card-text>
        <v-card-text v-if="busy" role="status">Waiting for the transmitter...</v-card-text>
        <v-card-text v-else-if="!socket_instance?.connected && !failed" role="status">Server disconnected. Calibration is unavailable.</v-card-text>
        <v-card-text v-if="step >= 2 && step < 4 && !failed">
          Cancelling ends this session but does not undo changes already applied to the transmitter.
        </v-card-text>
        <v-card-actions>
          <v-btn color="red" text @click="cancel()">
            {{ failed || step === 4 ? "Close" : busy ? "Stop waiting" : "Cancel" }}
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            v-if="!failed && step < 4"
            :disabled="busy || !socket_instance?.connected"
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

    <v-alert v-if="outcomeUnknown && !calibrate_dialog" type="warning" variant="tonal" class="mb-3" role="alert">
      The previous operation is unconfirmed. Check the transmitter and server before reloading to start another calibration. Stopping does not undo applied changes.
    </v-alert>
    <v-btn @click="openModal" :disabled="outcomeUnknown" color="primary" class="buttons">
      <v-icon class="mr-1">mdi-weight-gram</v-icon>
      Calibrate
    </v-btn>
  </div>
</template>

<script>
import axios from "axios";
import config from "@/config";
import { mapState } from "vuex";

let requestSequence = 0;

export default {
  name: "calibrateScale",
  data: () => ({
    calibrate_dialog: false,
    choose_scale: false,
    step: 0,
    args: null, // "belly" | "weight"
    responseTimeOut: null,
    busy: false,
    error: "",
    historyError: "",
    failed: false,
    sessionActive: false,
    pending: null,
    abandonedRequest: null,
    outcomeUnknown: false,
  }),
  computed: {
    ...mapState(["socket_instance"]),
    url_port: () => config.url_port(),
    url: () => config.url(),
    calibration_steps: () => [
      { message: "Click next to start calibration", icon: "mdi-weight-gram" },
      { message: "Leave only the permanent fixture on the scale, wait for stability, then select Next", icon: "mdi-weight-gram" },
      { message: "Add the 1000 g reference weight, wait for stability, then select Next", icon: "mdi-weight-gram" },
      { message: "Reference accepted. Keep the weight in place and select Save", icon: "mdi-weight-gram" },
      { message: "Calibration saved and verified", icon: "mdi-check" },
    ],
    step_info() {
      return this.calibration_steps[this.step];
    },
  },
  methods: {
    openModal() {
      if (this.outcomeUnknown) return;
      this.choose_scale = true;
    },
    setScale(scale) {
      if (this.outcomeUnknown || this.busy) return;
      this.args = scale; // "belly" | "weight"
      this.step = 0;
      this.error = "";
      this.historyError = "";
      this.failed = false;
      this.choose_scale = false;
      this.calibrate_dialog = true;
    },
    nextStep() {
      if (this.busy || this.failed || this.outcomeUnknown || !this.calibrate_dialog || this.step >= 4) return;
      if (this.args !== "belly" && this.args !== "weight") return;
      if (!this.socket_instance?.connected) {
        this._fail("Not connected to the server. Reconnect before starting a new calibration.");
        return;
      }
      this.busy = true;
      this.sessionActive = true;
      this.pending = {
        step: this.step + 1,
        args: this.args,
        request_id: `${Date.now()}-${++requestSequence}-${Math.random().toString(36).slice(2)}`,
      };
      clearTimeout(this.responseTimeOut);
      this.responseTimeOut = setTimeout(() => {
        this._fail("No confirmation received. The operation may still be running. Check the transmitter and server before restarting; applied changes are not undone.", true);
      }, 30000);
      this.socket_instance.emit("calibrate_load_cell", { ...this.pending });
    },
    cancel() {
      if (this.pending) {
        this.abandonedRequest = this.pending;
        this.outcomeUnknown = true;
      }
      this._clearPending();
      this._releaseSession();
      this.choose_scale = false;
      this.calibrate_dialog = false;
    },
    _clearPending() {
      clearTimeout(this.responseTimeOut);
      this.responseTimeOut = null;
      this.pending = null;
      this.busy = false;
    },
    _releaseSession(socket = this.socket_instance) {
      if (this.sessionActive && socket?.connected) {
        socket.emit("resume_net_update");
      }
      this.sessionActive = false;
    },
    _matches(data, request = this.pending) {
      return Boolean(request && data && data.request_id === request.request_id
        && data.step === request.step && data.args === request.args);
    },
    _settleAbandoned(data) {
      if (!this._matches(data, this.abandonedRequest)) return false;
      this.abandonedRequest = null;
      this.outcomeUnknown = false;
      this.error = "The previous operation has ended. Check the transmitter before starting a new calibration; applied changes were not undone.";
      return true;
    },
    _fail(message, uncertain = false) {
      if (uncertain && this.pending) {
        this.abandonedRequest = this.pending;
        this.outcomeUnknown = true;
      }
      this._clearPending();
      this._releaseSession();
      this.error = message;
      this.failed = true;
    },
    _onCalibAck(data) {
      if (this._settleAbandoned(data) || !this._matches(data)) return;
      this.step = data.step;
      this._clearPending();
      if (this.step === 4) {
        this.sessionActive = false;
        this.recordCalibration();
      }
    },
    _onCalibError(data) {
      if (this._settleAbandoned(data) || !this._matches(data)) return;
      const warning = data.step >= 2 ? " Applied changes are not undone. Check the transmitter before restarting." : "";
      this._fail((data.error || "Calibration failed.") + warning);
    },
    _onCalibExpired() {
      if (!this.sessionActive) return;
      this._fail("Calibration session expired. Check the transmitter before starting again; applied changes are not undone.", Boolean(this.pending));
    },
    _onDisconnect() {
      if (!this.sessionActive) return;
      this._fail("Connection lost. Check the transmitter and server before starting again; applied changes are not undone.", Boolean(this.pending));
    },
    _bindSocket(socket, bind) {
      if (!socket) return;
      const method = bind ? "on" : "off";
      socket[method]("calibration_step_commited", this._onCalibAck);
      socket[method]("calibration_error", this._onCalibError);
      socket[method]("calibration_expired", this._onCalibExpired);
      socket[method]("disconnect", this._onDisconnect);
    },
    recordCalibration() {
      if (this.args !== "belly" && this.args !== "weight") return;
      const url = `${this.url}:${this.url_port}`;
      const recordedRequest = requestSequence;
      axios
        .post(`${url}/add-calibration`, { load_cell: this.args })
        .catch(() => {
          if (this.step === 4 && recordedRequest === requestSequence) {
            this.historyError = "Calibration was saved on the transmitter, but its history entry could not be recorded.";
          }
        });
    },
  },
  watch: {
    socket_instance: {
      immediate: true,
      handler(socket, previous) {
        this._bindSocket(previous, false);
        if (previous && this.sessionActive) {
          this._releaseSession(previous);
          this._fail("Server connection changed. Check the transmitter before starting again; applied changes are not undone.", Boolean(this.pending));
        }
        this._bindSocket(socket, true);
      },
    },
  },
  beforeUnmount() {
    this._clearPending();
    this._releaseSession();
    this._bindSocket(this.socket_instance, false);
  },
};
</script>

<style lang="scss" scoped>
.calibration-title {
  white-space: normal;
  overflow-wrap: anywhere;
}
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
