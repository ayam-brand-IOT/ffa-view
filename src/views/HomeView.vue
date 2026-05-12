<template>
  <v-container fluid class="d-flex flex-column pa-0">
    <!-- Stepper: su propia fila -->
    <lot-stepper :current-step="1" />

    <!-- Info bar: lot info + status + buttons -->
    <div class="d-flex align-center px-4 py-2 info-bar">
      <span class="text-body-2 mr-2">
        Lot <strong>#{{ getAnalyzingLotNo }}</strong>
      </span>
      <span class="text-body-2 text-medium-emphasis">
        &nbsp;·&nbsp; Last: <strong>#{{ last_analysed_id }}</strong>
      </span>

      <v-chip
        :color="captureStatus.color"
        size="small"
        variant="tonal"
        class="ml-4"
        :prepend-icon="captureStatus.icon"
      >
        {{ captureStatus.text }}
      </v-chip>

      <v-spacer />

      <v-btn size="small" variant="text" to="/log" class="mr-1">
        <v-icon start>mdi-format-list-bulleted-square</v-icon>Log
      </v-btn>
      <v-btn size="small" variant="outlined" @click="takeExtraPicture()">
        <v-icon start>mdi-camera-plus</v-icon>Other Findings
      </v-btn>
    </div>

    <!-- Images row -->
    <v-row style="flex: 1; margin: 0" class="images-row">
      <!-- LIVE panel - mayor -->
      <v-col
        cols="8"
        class="d-flex flex-column pa-3"
        style="border-right: solid 1px lightgray"
      >
        <div class="d-flex align-center mb-1">
          <v-chip
            color="red"
            size="x-small"
            variant="flat"
            class="mr-2 live-chip"
          >
            <v-icon start size="x-small">mdi-record</v-icon>LIVE
          </v-chip>
          <span
            class="text-h6 font-weight-bold"
            :class="`text-${weightIsStable ? 'green' : 'red'}`"
            >{{ live.weight }} g</span
          >
        </div>
        <img
          class="the_image elevation-2"
          :class="{ 'capturing-pulse': debounceRequested || isProcessing }"
          :src="`${url_server}video_feed`"
          crossorigin="anonymous"
          ref="liveImage"
        />
      </v-col>

      <!-- CAPTURED panel - menor -->
      <v-col cols="4" class="d-flex flex-column pa-3">
        <div class="d-flex align-center mb-1">
          <v-chip
            color="blue-darken-1"
            size="x-small"
            variant="flat"
            class="mr-2"
            >CAPTURED</v-chip
          >
          <span class="text-h6 font-weight-bold">{{ captured.weight }} g</span>
        </div>
        <img
          v-if="analyzed_image"
          class="the_image elevation-2"
          :src="analyzed_image"
          ref="capturedImage"
          crossorigin="anonymous"
        />
        <div
          v-else
          class="the_image captured-placeholder d-flex flex-column align-center justify-center"
        >
          <v-icon size="large" color="grey-lighten-1"
            >mdi-image-off-outline</v-icon
          >
          <span class="text-caption text-grey mt-1">No sample yet</span>
        </div>
        <!-- Captured indicators -->
        <div class="d-flex flex-wrap px-4">
          <div
            v-for="(indicator, i) in captured.indicators"
            :key="`cap-${i}`"
            class="indicator-wrapper d-flex flex-column align-center"
          >
            <span
              class="text-caption"
              :class="`text-${indicator.status ? 'black' : 'grey'}`"
              >{{ indicator.name }}</span
            >
            <div
              class="indicator"
              :class="indicator.status ? 'active' : 'inactive'"
            ></div>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Indicators row -->
    <v-row
      style="flex: none; margin: 0; border-bottom: solid 1px lightgray"
      class="pb-2"
    >
      <!-- Live indicators -->
      <v-col
        cols="8"
        class="d-flex flex-wrap px-4"
        style="border-right: solid 1px lightgray"
      >
        <div
          v-for="(indicator, i) in live.indicators"
          :key="`live-${i}`"
          class="indicator-wrapper d-flex flex-column align-center"
        >
          <span
            class="text-caption"
            :class="`text-${indicator.status ? 'black' : 'grey'}`"
            >{{ indicator.name }}</span
          >
          <div
            class="indicator"
            :class="indicator.status ? 'active' : 'inactive'"
          ></div>
          <span class="key-label">{{ displayKey(indicator.key) }}</span>
        </div>
      </v-col>
    </v-row>

    <!-- Bottom buttons -->
    <div class="d-flex justify-end align-center px-4 py-2">
      <v-btn
        @click="finishLotAnalysis"
        size="large"
        color="grey"
        variant="text"
        class="mr-3"
      >
        <v-icon start>mdi-close</v-icon>Cancel Lot
      </v-btn>
      <v-btn @click="goToBRT" size="x-large" color="primary">
        Next: BRT
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
    </div>

    <!-- Modals & helpers -->
    <save-dialog
      v-model="saveDialog"
      @confirm="continueRoute(true)"
      @cancel="continueRoute()"
    />

    <v-btn
      style="position: absolute; bottom: 55px; left: 15px"
      color="primary"
      icon
      @click="openCommandList"
      title="help btn"
    >
      <v-icon>mdi-help-circle</v-icon>
    </v-btn>

    <preview-extra-image
      ref="imagePreview"
      :image="extraImage"
      @add="addExtraImage"
      @close="canceledExtraImage"
    />
    <notification ref="notification" />
    <commandList :commands-list="getCommands" ref="commandList" />
  </v-container>
</template>

<script>
import axios from "axios";
import config from "../config";
import { mapState, mapGetters } from "vuex";
import commandList from "@/components/commandList.vue";
import pushNotification from "@/components/pushNotification.vue";
import PreviewExtraImage from "@/components/previewExtraImage.vue";
import SaveDialog from "@/components/SaveDialog.vue";
import LotStepper from "@/components/LotStepper.vue";

export default {
  components: {
    notification: pushNotification,
    PreviewExtraImage,
    commandList,
    SaveDialog,
    LotStepper,
  },
  data: () => ({
    lot: null,
    saveDialog: false,
    to: null,
    weightIsStable: false,
    isProcessing: false,
    live: {
      weight: 0,
      indicators: [],
    },
    captured: {
      weight: 0,
      indicators: [],
    },
    analyzed_image: null,
    capture_state: true,
    analysis_data: null,
    laser_state: false,
    extraImage: null,
  }),
  computed: {
    ...mapState(["socket_instance", "last_analysed_id"]),
    ...mapGetters(["getAnalyzingLotNo"]),
    url_server: () => config.url_server(),
    url_port: () => config.url_port(),
    url: () => config.url(),
    getCommands: () => {
      const { actions, defects } = config;
      return { ...defects, ...actions };
    },
    filtered_indicators() {
      return this.captured.indicators.reduce((acc, value) => {
        if (value.status) acc.push(value.id);
        return acc;
      }, []);
    },
    captureStatus() {
      if (this.debounceRequested) {
        return { text: "Stabilizing...", color: "orange", icon: "mdi-scale" };
      }
      if (this.isProcessing) {
        return { text: "Processing...", color: "blue", icon: "mdi-cog-sync" };
      }
      if (this.analyzed_image) {
        return {
          text: "Ready for next sample",
          color: "green",
          icon: "mdi-check-circle",
        };
      }
      return { text: "Ready to capture", color: "primary", icon: "mdi-camera" };
    },
  },
  methods: {
    displayKey(key) {
      const map = { tab: "Tab", shift: "Shft", escape: "Esc", control: "Ctrl", capslock: "Caps" };
      return map[key] ?? String(key).toUpperCase();
    },
    notify(message, type = "success") {
      this.$refs.notification.push(message, type);
    },
    openCommandList() {
      this.$refs.commandList.open();
    },

    updateNet() {
      this.socket_instance.emit("update_net", {});
    },

    evokeAction(action) {
      switch (action) {
        case "CAPTURE":
          this.debounceRequested = true;
          console.log("debounce requested");
          this.handleWeightChanged(this.live.weight, 0);
          this.timeoutSample = setTimeout(() => {
            this.debounceRequested = false;
            console.log("debounce timer cleared");
          }, 4000);
          break;
        case "CANCEL":
          this.cancel();
          break;
        case "TOGGLE":
          this.toggle_laser();
          break;
        case "TARE":
          this.setTare();
          break;
        case "ZERO":
          this.setZero();
          break;
        case "EXTRA":
          if (config.NO_LOT_SELECTED == this.getAnalyzingLotNo) return;
          this.takeExtraPicture();
          break;
        case "BRT":
          if (config.NO_LOT_SELECTED == this.getAnalyzingLotNo) return;
          if (this.analyzed_image) this.saveData();
          this.$router.push("/broken-belly-test");
          break;
      }
    },

    continueRoute(save = false) {
      if (save) {
        this.saveData();
      }
      this.resetCaptured();
      this.analyzed_image = null;
      this.saveDialog = false;
      this.$router.push(this.to);
    },

    keyboardCatch(event) {
      const key = event.key.toLowerCase();
      const { defects, actions } = config;
      const { indicators } = this.live;

      if (this.saveDialog) {
        if (key === "y") {
          event.preventDefault();
          this.continueRoute(true);
        }
        if (key === "n") {
          event.preventDefault();
          this.continueRoute();
        }
        return;
      }

      if (defects.hasOwnProperty(key)) {
        event.preventDefault();
        const index = indicators.findIndex(
          (indicator) => indicator.key.toLowerCase() == key,
        );
        this.live.indicators[index].status = !indicators[index].status;
      } else if (actions.hasOwnProperty(key)) {
        const index = actions[key].name;
        event.preventDefault();
        console.warn("action", index);
        this.evokeAction(index);
      }
    },

    setTare() {
      this.notify("Tare command sent", "success");
      this.socket_instance.emit("set_tare", {});
    },

    setZero() {
      this.notify("Zero command sent", "success");
      this.socket_instance.emit("set_zero", {});
    },

    toggle_laser() {
      this.laser_state = !this.laser_state;
      this.notify(`Laser ${this.laser_state ? "ON" : "OFF"}`, "success");
      this.socket_instance.emit("laser", { state: this.laser_state });
    },

    canceledExtraImage() {
      this.extraImage = null;
      this.$refs.imagePreview.close();
    },

    addExtraImage() {
      this.extraImage = null;
      this.$refs.imagePreview.close();
    },

    finishLotAnalysis() {
      this.lot = null;
      this.$store.dispatch("setAnalyzingLot", null);
      this.$router.push({ path: "/" });
    },

    goToBRT() {
      if (this.analyzed_image) this.saveData();
      this.$router.push("/broken-belly-test");
    },

    capture() {
      if (this.analyzed_image) this.saveData();
      this.notify("Image captured", "success");
      this.captured = JSON.parse(JSON.stringify(this.live));
      this.putData("capture", {});
      this.capture_state = !this.capture_state;
      this.isProcessing = true;
      this.resetLive();
    },

    cancel() {
      this.resetCaptured();
      this.saveDialog = false;
      this.resetLive();
      this.analyzed_image = null;
      this.isProcessing = false;
    },

    dataURLtoFile(imageElement, filename, returnAsdataURL = false) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = 1000;
      canvas.height = 650;
      context.drawImage(imageElement, 0, 0);

      const dataURL = canvas.toDataURL("image/jpeg");
      if (returnAsdataURL) {
        const arr = dataURL.split(",");
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      }

      const arr = dataURL.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);

      return new File([u8arr], filename, { type: mime });
    },

    saveData() {
      this.saveDialog = false;
      const imageElement = this.$refs.capturedImage;

      const file = this.dataURLtoFile(imageElement, "image.jpg");

      const { analysis_data, filtered_indicators, captured } = this;
      const { weight } = captured;

      const formData = new FormData();
      formData.append("defects", JSON.stringify(filtered_indicators));
      formData.append("weight", weight);
      formData.append("length", analysis_data.length);
      formData.append("height", analysis_data.height);
      formData.append("head", analysis_data.head);
      formData.append("tail_trigger", analysis_data.tail_trigger);
      formData.append("image", file);
      formData.append("lot_no", this.getAnalyzingLotNo);

      this.submitRequest(formData);
    },

    async submitRequest(formData) {
      axios
        .post(`${this.url}:${this.url_port}/add`, formData, {
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        })
        .then(
          (response) => {
            console.log(response.data.id);
            this.$store.dispatch("setLastAnalysedId", response.data.id);
          },
          (error) => {
            this.confirm = false;
            console.log(error);
          },
        );
    },

    putData(url, options) {
      this.socket_instance.emit(url, options);
      console.warn("putData", url, options);
    },

    resetCaptured() {
      this.captured.indicators.forEach((indicator) => {
        indicator.status = false;
      });
      this.captured.weight = 0;
    },

    resetLive() {
      this.live.indicators.forEach((indicator) => {
        indicator.status = false;
      });
      this.live.weight = 0;
    },

    takeExtraPicture() {
      const imageElement = this.$refs.liveImage;
      const previewModal = this.$refs.imagePreview;
      this.extraImage = this.dataURLtoFile(imageElement, "image.jpg", true);
      previewModal.open();
    },

    handleHasBeenDebounced() {
      this.debounceRequested = false;
      this.capture();
    },

    handleWeightChanged(newValue, oldValue) {
      if (!this.debounceRequested) {
        this.weightIsStable = false;
        return;
      }

      if (this.debounceTimer) clearTimeout(this.debounceTimer);

      if (newValue == 0) {
        this.notify("Weight is not stable", "error");
        return;
      }

      const difference = (Math.abs(newValue - oldValue) / oldValue) * 100;

      if (difference < 5) {
        if (this.timeoutSample) {
          clearTimeout(this.timeoutSample);
          this.debounceRequested = false;
        }
        this.weightIsStable = true;
        this.handleHasBeenDebounced(newValue);
      } else {
        this.debounceTimer = setTimeout(() => {
          if (this.timeoutSample) {
            clearTimeout(this.timeoutSample);
            this.debounceRequested = false;
          }
          this.weightIsStable = true;
          this.handleHasBeenDebounced(newValue);
        }, 1000);
      }
    },
  },

  beforeRouteLeave(to, from, next) {
    console.warn("a donde puto");
    if (this.analyzed_image) {
      this.to = to;
      this.saveDialog = true;
    } else {
      next();
    }
  },

  mounted() {
    var { defects } = config;

    window.addEventListener("keyup", this.keyboardCatch);
    this.interval = setInterval(this.updateNet, 250);

    Object.keys(defects).forEach((value) => {
      const { name, id } = defects[value];
      this.live.indicators.push({ name, status: false, key: value, id });
      this.captured.indicators.push({ name, status: false, key: value, id });
    });

    window.addEventListener("beforeunload", (event) => {
      if (this.analyzed_image) {
        this.saveDialog = true;
        event.preventDefault();
        event.returnValue = "";
      }
    });

    const { socket_instance } = this;

    socket_instance.emit("set_tare", {});
    socket_instance.emit("enter_to_weight_mode", {});

    socket_instance.on("weight_update", (data) => {
      this.live.weight = data;
    });

    socket_instance.on("analysis_data", (data) => {
      this.analysis_data = JSON.parse(data);
    });

    socket_instance.on("frame_ready", () => {
      this.analyzed_image = `${this.url_server}analyzed_image?${Date.now()}`;
      this.isProcessing = false;
    });
  },

  beforeDestroy() {
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
  },

  beforeUnmount() {
    window.removeEventListener("keyup", this.keyboardCatch);
    this.socket_instance.off("weight_update");
    this.socket_instance.off("analysis_data");
    this.socket_instance.off("frame_ready");
    if (this.interval) clearInterval(this.interval);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  },

  watch: {
    lot: {
      handler: function (newVal) {
        this.$store.dispatch("setAnalyzingLot", newVal);
        const fish_species = newVal?.fish_species;
        const type = newVal?.type;
        this.socket_instance.emit("set_fish_data", { fish_species, type });
      },
      deep: true,
    },
    "live.weight": {
      handler: function (newValue, oldValue) {
        this.handleWeightChanged(newValue, oldValue);
      },
      deep: true,
    },
  },
};
</script>

<style scoped lang="scss">
.info-bar {
  border-bottom: solid 1px lightgray;
  flex-shrink: 0;
}

.images-row {
  flex: 1;
}

.the_image {
  width: 100%;
  max-height: calc(100vh - 440px);
  object-fit: contain;
  border: solid 1px #ccc;
  border-radius: 5px;
  background-color: #444;
  display: block;
}

.capturing-pulse {
  animation: pulse-border 0.8s ease-in-out infinite;
  outline: 3px solid orange;
  outline-offset: 2px;
}

@keyframes pulse-border {
  0%,
  100% {
    outline-color: orange;
  }
  50% {
    outline-color: transparent;
  }
}

.captured-placeholder {
  height: 200px;
  background-color: #f5f5f5;
  border: 2px dashed #ccc !important;
}

.live-chip {
  animation: blink 2s ease-in-out infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.indicator-wrapper {
  width: 60px;
  max-height: 75px;
  padding: 4px 6px;
}

.key-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: #1565C0;
  letter-spacing: 0.03em;
  margin-top: 5px;
  line-height: 1;
  border: solid 1px #1565C0;
  border-radius: 3px;
  padding: 2px 4px;
}

.indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.inactive {
  background-color: red;
}

.active {
  background-color: greenyellow;
}
</style>
