<template>
  <v-container class="length-calib" style="height: 100%">
    <v-row style="height: 100%" justify="center">
      <v-col cols="11">
        <div class="d-flex mb-5 align-center">
          <router-link to="/config" class="mr-3">
            <v-btn icon variant="text">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
          </router-link>
          <h2 class="font-weight-medium">Vision Measurement Calibration</h2>
        </div>

        <v-card elevation="2">
          <v-card-text>
            <!-- Clear instructions -->
            <v-alert type="info" class="mb-4">
              <ol class="ma-0 pl-4">
                <li>
                  Use the
                  <strong
                    >arrow keys <v-icon>mdi-arrow-left-thick</v-icon>
                    <v-icon>mdi-arrow-right-thick</v-icon>
                  </strong>
                  to move the lines pixel by pixel.
                </li>
                <li>
                  Hold
                  <strong>
                    <v-icon>mdi-apple-keyboard-shift</v-icon> Shift</strong
                  >
                  to move by 10 pixels at a time.
                </li>
                <li>
                  Adjust both lines to mark the real-world distance. and clic
                  <strong> <v-icon>mdi-keyboard-return</v-icon> Enter</strong>
                </li>
                <li>
                  Enter the actual distance in <strong>millimeters</strong> and
                  click <strong>Calibrate</strong>.
                </li>
              </ol>
            </v-alert>

            <div class="content-wrapper">
              <v-col class="d-flex justify-center" cols="12">
                <moving-line @onFinish="handlePXdistance" ref="lineSelector" />
              </v-col>
            </div>

            <v-row v-show="amountOfPixels" class="align-center">
              <v-col cols="12" sm="5">
                <v-text-field
                  label="Distance in Pixels"
                  variant="underlined"
                  :model-value="amountOfPixels"
                  readonly
                />
              </v-col>
              <v-col cols="12" sm="5">
                <v-text-field
                  v-model="distanceOnMm"
                  label="Actual Distance (mm)"
                  variant="underlined"
                  type="number"
                  min="0"
                />
              </v-col>
              <v-col cols="12" sm="2" class="d-flex justify-end">
                <v-btn
                  @click="saveData"
                  color="success"
                  class="mr-2"
                  :disabled="canBeSubmitted"
                >
                  <v-icon left>mdi-check-bold</v-icon>
                  Calibrate
                </v-btn>

                <v-btn
                  @click="resetLineSelector"
                  color="error"
                  variant="outlined"
                >
                  <v-icon left>mdi-refresh</v-icon>
                  Reset
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <notification ref="notification" />
    <requestModal ref="loadingModal" />
  </v-container>
</template>

<script>
import axios from "axios";
import MovingLine from "@/components/MovingLine.vue";
import config from "@/config";
import requestModal from "@/components/requestModal.vue";
import pushNotification from "@/components/pushNotification.vue";
import { mapState, mapGetters } from "vuex";

export default {
  name: "LengthCalib",
  components: {
    MovingLine,
    notification: pushNotification,
    requestModal,

  },
  data() {
    return {
      amountOfPixels: 0,
      distanceOnMm: 0,
    };
  },
  computed: {
    url_port: () => config.url_port(),
    url_server: () => config.url_server(),
    ...mapState({}),
    ...mapGetters({}),
    canBeSubmitted() {
      return !(this.amountOfPixels > 0 && this.distanceOnMm > 0);
    },
  },
  methods: {
    resetLineSelector() {
      this.$refs.lineSelector.reset();
    },
    handlePXdistance(px) {
      this.amountOfPixels = px.distance;
    },
    saveData() {
      const ratio = this.distanceOnMm / this.amountOfPixels;
      const jsonData = { ratio };
      this.submitRequest(jsonData);
    },
    async submitRequest(jsonData) {
      this.$refs.loadingModal.open();
      try {
        await axios.post(`${this.url_server}length_calibration`, jsonData, {
          withCredentials: false,
          headers: {
            Accept: "application/json",
          },
        });
        this.$refs.loadingModal.close(500);
        this.notify("Length calibrated successfully", "success");

        // CLEAR FIELDS
        this.amountOfPixels = 0;
        this.distanceOnMm = 0;
        this.resetLineSelector();

        // Optionally notify user here
      } catch (error) {
        console.error("Calibration submission failed:", error);
        this.notify("Length calibration failed.", "error");
        this.$refs.loadingModal.fail();
      }
    },
    notify(text, type, time) {
      this.$refs.notification.push(text, type, time);
    },
  },
};
</script>

<style lang="scss" scoped>
.the_fuckin_image {
  width: 100%;
  min-width: 100%;
  min-height: 100%;
  border: solid 1px gray;
  border-radius: 5px;
  background-color: gray;
}
.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>

<style lang="scss">
.length-calib {
  .instructions {
    -webkit-line-clamp: none !important;
  }
}
</style>
