<template>
  <v-container style="height: 100%">
    <v-row style="height: 100%" justify="center">
      <v-col cols="11">
        <!-- Back Button + Title -->
        <div class="d-flex mb-5 align-center">
          <router-link to="/config" class="mr-2">
            <v-btn icon variant="text">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
          </router-link>
          <h2 class="font-weight-medium">2-Point Calibration</h2>
        </div>

        <!-- Card -->
        <v-card elevation="2">
          <v-card-text>
            <!-- Instructions -->
            <v-alert type="info" class="mb-4">
              <ol class="ma-0 pl-4">
                <li>Click on the top-left point of your area of interest.</li>
                <li>
                  Click on the bottom-right point to complete the rectangle.
                </li>
                <li>Click <strong>Calibrate</strong> to save the zone.</li>
              </ol>
            </v-alert>

            <!-- Image Selector -->
            <div class="content-wrapper">
              <v-col class="d-flex justify-center" cols="12">
                <TwoPointSquare
                  @onFinish="handle2Points"
                  ref="SquareSelector"
                />
              </v-col>
            </div>

            <!-- Buttons and coordinate display -->
            <v-row class="mt-4 align-center" v-show="twoPoints.length === 2">
              <v-col cols="12" sm="6">
                <v-chip class="ma-1" color="info" label>
                  Point 1: X: {{ twoPoints[0]?.x.toFixed(2) }}, Y:
                  {{ twoPoints[0]?.y.toFixed(2) }}
                </v-chip>
                <v-chip class="ma-1" color="info" label>
                  Point 2: X: {{ twoPoints[1]?.x.toFixed(2) }}, Y:
                  {{ twoPoints[1]?.y.toFixed(2) }}
                </v-chip>
              </v-col>

              <v-col cols="12" sm="6" class="d-flex justify-end">
                <v-btn
                  @click="resetSquareSelector"
                  color="error"
                  variant="outlined"
                  class="mr-3"
                >
                  <v-icon left>mdi-refresh</v-icon>
                  Reset
                </v-btn>

                <v-btn
                  @click="saveData"
                  color="success"
                  :disabled="!readyToSubmit"
                >
                  <v-icon left>mdi-check-bold</v-icon>
                  Calibrate
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <notification ref="notification" />
  </v-container>
</template>

<script>
import axios from "axios";
import TwoPointSquare from "@/components/TwoPointSquare.vue";
import config from "@/config";
import pushNotification from "@/components/pushNotification.vue";

import { mapState, mapGetters } from "vuex";

export default {
  name: "TwoPointCalibration",
  components: {
    TwoPointSquare,
    notification: pushNotification,
  },
  data() {
    return {
      twoPoints: [],
    };
  },
  computed: {
    url_port: () => config.url_port(),
    url_server: () => config.url_server(),
    ...mapState({}),
    ...mapGetters({}),
    readyToSubmit() {
      return this.twoPoints.length === 2;
    },
  },
  methods: {
    resetSquareSelector() {
      this.$refs.SquareSelector.reset();
      this.twoPoints = [];
    },
    handle2Points(points) {
      this.twoPoints = points;
      console.log("Selected points:", points);
    },
    saveData() {
      const data = this.twoPoints;
      this.submitRequest(data);
    },
    notify(text, type, time) {
      this.$refs.notification.push(text, type, time);
    },
    async submitRequest(jsonData) {
      try {
        await axios.post(`${this.url_server}calibrate_zoi`, jsonData, {
          withCredentials: false,
          headers: {
            Accept: "application/json",
          },
        });
        // Feedback opcional
        this.notify("Zone calibrated successfully", "success");
        // CLEAR FIELDS
        this.twoPoints = [];
        this.resetSquareSelector();
      } catch (error) {
        console.error("Error sending calibration:", error);
        this.notify("Failed to calibrate zone.", "error");
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
