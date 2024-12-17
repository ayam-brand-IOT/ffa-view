<template>
  <v-container fluid>
    <div class="d-flex align-baseline">
      <h3 class="mb-3 ml-4">Lot #:</h3>
      <u @click="chooseLot" class="text-blue ml-1">{{ getAnalyzingLotNo }}</u>
      <h4 class="mb-3 ml-4">Last sample #:</h4>
      <span class="ml-1">{{ last_analysed_id }}</span>
      <v-spacer></v-spacer>
      <v-btn @click="takeExtraPicture()">
        <v-icon>mdi-camera-plus</v-icon>
        Take extra picture
      </v-btn>
      <v-btn to="/broken-belly-test">
        <v-icon>mdi-arrow-expand-horizontal</v-icon>
        BBT
      </v-btn>
    </div>
    <v-row>
      <v-col style="border-right: solid 1px lightgray" cols="6">
        <img
          class="the_fuckin_image elevation-2"
          :src="`${url_server}video_feed`"
          crossorigin="anonymous"
          ref="liveImage"
        />
      </v-col>
      <v-col cols="6">
        <!-- analyzed_image -->
        <img
          class="the_fuckin_image elevation-2"
          :src="analyzed_image"
          ref="capturedImage"
          crossorigin="anonymous"
        />
      </v-col>
    </v-row>
    <v-row style="border-bottom: solid 1px lightgray" class="pb-2">
      <v-col
        cols="6"
        class="d-flex flex-column px-7"
        style="border-right: solid 1px lightgray"
      >
        <h2>Weight:</h2>
        <h1 class="ml-3" :class="`text-${weightIsStable ? 'green' : 'red'}`">
          {{ live.weight }} g
        </h1>
        <!-- <v-col cols="12" class="d-flex"> -->
        <v-row>
          <v-col
            cols="2"
            v-for="(indicator, i) in live.indicators"
            class="d-flex px-3 indicator-wrapper"
          >
            <div class="d-flex flex-column align-center">
              <span :class="`text-${indicator.status ? 'black' : 'grey'}`">
                {{ indicator.name }}
              </span>
              <div
                class="indicator"
                :class="indicator.status ? 'active' : 'inactive'"
              ></div>
            </div>
          </v-col>
        </v-row>
        <!-- </v-col> -->
      </v-col>
      <v-col cols="6" class="d-flex flex-column px-7">
        <h2>Weight:</h2>
        <h1 class="ml-3">{{ captured.weight }} g</h1>
        <!-- <v-col cols="12" class="d-flex"> -->
        <v-row>
          <v-col
            cols="2"
            v-for="(indicator, i) in captured.indicators"
            class="d-flex px-3 indicator-wrapper"
          >
            <div class="d-flex flex-column align-center">
              <span :class="`text-${indicator.status ? 'black' : 'grey'}`">
                {{ indicator.name }}
              </span>
              <div
                class="indicator"
                :class="indicator.status ? 'active' : 'inactive'"
              ></div>
            </div>
          </v-col>
        </v-row>
        <!-- </v-col> -->
      </v-col>
    </v-row>
    <v-row class="mt-0">
      <v-spacer></v-spacer>

      <v-btn
        @click="finishLotAnalysis"
        size="x-large"
        color="success"
        class="mr-5 mt-5"
      >
        <v-icon>mdi-check</v-icon>
        Finish Lot
      </v-btn>
    </v-row>

    <v-dialog
      persistent
      v-model="saveDialog"
      transition="dialog-bottom-transition"
      width="auto"
    >
      <v-card>
        <div class="px-5 pt-4 text-h6">Alert</div>
        <v-card-text>
          <div class="pb-3 pt-2 text-body-2">
            You're leaving without <b>save</b>,<br />
            Would you like to save the last test?
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn color="red" variant="text" @click="cancel"> No </v-btn>
          <v-btn color="success" variant="text" @click="saveData"> Yes </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <select-lot ref="selectLotModal" v-model="lot" />
    <preview-extra-image
      ref="imagePreview"
      :image="extraImage"
      @add="addExtraImage"
      @close="canceledExtraImage"
    />
    <notification ref="notification" />
    <commandList :commands-list="getCommands" />
  </v-container>
</template>

<script>
import axios from "axios";
import config from "../config";
import { mapState, mapGetters } from "vuex";
import selectLot from "@/components/selectLot.vue";
import commandList from "@/components/commandList.vue";
import pushNotification from "@/components/pushNotification.vue";
import PreviewExtraImage from "@/components/previewExtraImage.vue";

export default {
  components: {
    selectLot,
    notification: pushNotification,
    PreviewExtraImage,
    commandList,
  },
  data: () => ({
    lot: null,
    saveDialog: false,
    to: null,
    weightIsStable: false,
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
      const { indicators } = this.captured;
      return indicators.reduce((acc, value, index) => {
        if (value.status) acc.push(value.id);
        return acc;
      }, []);
    },
  },
  methods: {
    notify(message, type = "success") {
      this.$refs.notification.push(message, type);
    },

    updateNet() {
      this.socket_instance.emit("update_net", {});
    },

    evokeAction(action) {
      switch (action) {
        case "CAPTURE":
          // this.capture();
          this.debounceRequested = true;
          console.log("debounce requested");
          this.handleWeightChanged(this.live.weight, 0);
          this.timeoutSample = setTimeout(() => {
            this.debounceRequested = false;
            console.log("debounce timer cleared");
          }, 4000); // Debounce time de 1000 ms
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
        case "BBT":
          if (config.NO_LOT_SELECTED == this.getAnalyzingLotNo) return;
          this.$router.push("/broken-belly-test");
          break;
      }
    },

    keyboardCatch(event) {
      const key = event.key.toLowerCase();
      const { defects, actions } = config;
      const { indicators } = this.live;

      //if in defects exist on key name with the key pressed
      if (defects.hasOwnProperty(key)) {
        event.preventDefault();
        const index = indicators.findIndex(
          (indicator) => indicator.key.toLowerCase() == key
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
    },

    capture() {
      // if(!this.weightIsStable){
      //   this.notify("Weight is not stable", "warning");
      //   return;
      // }
      if (this.analyzed_image) this.saveData();
      this.notify("Image captured", "success");
      this.captured = JSON.parse(JSON.stringify(this.live));
      this.putData("capture", {});
      this.capture_state = !this.capture_state;
      this.resetLive();
    },

    cancel() {
      this.saveDialog = false;
      this.resetCaptured();
      this.resetLive();
      this.analyzed_image = null;
    },

    dataURLtoFile(imageElement, filename, returnAsdataURL = false) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = 1000;
      canvas.height = 650;
      context.drawImage(imageElement, 0, 0);

      // Get the data URL of the image from the canvas
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

    chooseLot() {
      this.$refs.selectLotModal.open_select = true;
    },

    saveData() {
      this.saveDialog = false;
      const imageElement = this.$refs.capturedImage;

      const file = this.dataURLtoFile(imageElement, "image.jpg");

      const { analysis_data, filtered_indicators, captured } = this;
      const { weight } = captured;

      // console.warn(filtered_indicators);

      const formData = new FormData();
      formData.append("defects", JSON.stringify(filtered_indicators));
      formData.append("weight", weight);
      formData.append("length", analysis_data.length);
      formData.append("height", analysis_data.height);
      formData.append("head", analysis_data.head);
      formData.append("tail_trigger", analysis_data.tail_trigger);
      formData.append("image", file); // Append the image data URL
      formData.append("lot_no", this.getAnalyzingLotNo);

      // console.log("Form Data:");
      // for (const [key, value] of formData.entries()) {
      //   console.log(key, value);
      // }

      this.submitRequest(formData);
    },

    async submitRequest(formData) {
      // const loading = this.$loading();
      axios
        .post(`${this.url}:${this.url_port}/add`, formData, {
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        })
        .then(
          (response) => {
            // this.confirm = false;
            // this.reset();
            console.log(response.data.id);
            this.$store.dispatch("setLastAnalysedId", response.data.id);
            // setTimeout(() => {
            //   loading.close();
            //   window.location.reload();
            // }, 1000);
            // this.$notify({
            //   message: "Información guardada con éxito.",
            //   type: "success"
            // });
          },
          (error) => {
            this.confirm = false;
            console.log(error);
            // setTimeout(() => {
            //   loading.close();
            // }, 1000);
            // this.$notify.error("Ha habido un error.");
          }
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

      // previewModal.previewImage();
      previewModal.open();

      // this.captured = JSON.parse(JSON.stringify(this.live));
      // this.putData("capture", {});
      // this.capture_state = !this.capture_state;
      // this.resetLive();
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
        console.warn("weight is 0");
        return;
      }

      const difference = (Math.abs(newValue - oldValue) / oldValue) * 100;

      if (difference < 2) {
        if (this.timeoutSample) {
          clearTimeout(this.timeoutSample);
          this.debounceRequested = false;
          console.log("debounce timer cleared");
        }

        console.log(
          `El peso se ha estabilizado en: ${newValue} con una diferencia menor al 2%`
        );
        this.weightIsStable = true;
        this.handleHasBeenDebounced(newValue);
      } else {
        // Si la diferencia es igual o mayor al 2%, aplica el debouncing
        this.debounceTimer = setTimeout(() => {
          if (this.timeoutSample) {
            clearTimeout(this.timeoutSample);
            this.debounceRequested = false;
            console.log("debounce timer cleared");
          }

          console.log(
            `El peso se ha estabilizado en: ${newValue} después del debounce time`
          );
          this.weightIsStable = true;
          this.handleHasBeenDebounced(newValue);
        }, 1000); // Debounce time de 1000 ms
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

    // iterate over the defects and create the indicators
    Object.keys(defects).forEach((value, index) => {
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
      const la_merde = JSON.parse(data);
      this.analysis_data = la_merde;
      // console.log(la_merde);
    });

    socket_instance.on("frame_ready", () => {
      this.analyzed_image = `${this.url_server}analyzed_image?${Date.now()}`;
    });

    if (this.getAnalyzingLotNo == config.NO_LOT_SELECTED) {
      this.$refs.selectLotModal.should_persist = true;
      this.chooseLot();
    }
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
      handler: function (newVal, oldVal) {
        console.warn("lot changed", newVal, oldVal);
        this.$store.dispatch("setAnalyzingLot", newVal);
        if (newVal == null) {
          this.$refs.selectLotModal.should_persist = true;
          this.chooseLot();
        }
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
.the_fuckin_image {
  width: 80%;
  min-width: 80%;
  min-height: 100%;
  border: solid 1px gray;
  border-radius: 5px;
  background-color: gray;
  /* height: 300px; */
}
.indicator-wrapper {
  max-height: 75px;
}
.indicator {
  width: 24px;
  height: 24px;
  border-radius: 12px;
}
.history-btn {
  position: absolute;
  bottom: 55px;
  right: 55px;
}
.inactive {
  background-color: red;
}
.active {
  background-color: greenyellow;
}
</style>
