<template>
  <v-container style="height: 100%">
    <!-- <div>
      <h1>Configuration</h1>
    </div> -->
    <v-row style="height: 100%" justify="center">
      <v-col cols="10">
        <h3 class=" mb-3">
          <v-icon class="mr-2">mdi-package-variant-closed</v-icon>
          Lots Information
        </h3>
        <v-card elevation="2">
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title>List of lots</v-list-item-title>

                <v-list-item-subtitle>
                  Edit, add or delete lots to analyze
                </v-list-item-subtitle>
                <v-list-item-action class="justify-end">
                  <v-btn to="/config/lot-info" color="primary" class="buttons">
                    <v-icon class="mr-1">mdi-view-list</v-icon>
                    Manage
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Export data</v-list-item-title>

                <v-list-item-subtitle>
                  Export lots data to a CSV file
                </v-list-item-subtitle>
                <v-list-item-action class="justify-end">
                  <v-btn
                    to="/config/export-lot-data"
                    color="primary"
                    class="buttons"
                  >
                    <v-icon class="mr-1">mdi-download</v-icon>
                    Manage
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <h3 class="mt-10 mb-3">
          <v-icon class="mr-2">mdi-weight</v-icon>
          Load Cell
        </h3>
        <v-card elevation="2">
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title>Calibrate</v-list-item-title>

                <v-list-item-subtitle>
                  with this parameter you can calibrate the load cell
                </v-list-item-subtitle>
                <v-list-item-action class="justify-end">
                  <!-- <v-btn color="primary" class="buttons">
                    <v-icon>mdi-weight-gram</v-icon>
                    Calibrate
                  </v-btn> -->
                  <calibrate-scale />
                </v-list-item-action>
              </v-list-item>

              <!-- <v-list-item>
                <v-list-item-title>Tare</v-list-item-title>

                <v-list-item-subtitle>
                  with this parameter you setup the Tare
                </v-list-item-subtitle>
                <v-list-item-action class="justify-end">
                  <v-btn @click="setTare()" color="primary" class="buttons">
                    <v-icon class="mr-1">mdi-scale-balance</v-icon>
                    Tare
                  </v-btn>
                </v-list-item-action>
              </v-list-item> -->
              <!-- <v-list-item>
                <v-list-item-title>Zero</v-list-item-title>
  
                <v-list-item-subtitle>
                  with this parameter you can set the Zero
                </v-list-item-subtitle>
                <v-list-item-action class="justify-end">
                  <v-btn @click="setZero()" color="primary" class="buttons">
                    <v-icon class="mr-1">mdi-numeric-0-box</v-icon>
                    Zero
                  </v-btn>
                </v-list-item-action>
              </v-list-item> -->
            </v-list>
          </v-card-text>
        </v-card>

        <h3 class="mt-10 mb-3" >
          <v-icon class="mr-2">mdi-eye</v-icon>
          Vision parameters
        </h3>
        <v-card elevation="2" >
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title>Calibrate ZOI</v-list-item-title>
                <v-list-item-subtitle>
                  Live calibrate Zone of Interest
                </v-list-item-subtitle>
                <v-list-item-action class="justify-end">
                  <v-btn
                    to="/config/zoi-calibration"
                    color="primary"
                    class="buttons"
                  >
                  <v-icon class="mr-1">mdi-vector-square</v-icon>
                    Manage
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Calibrate Length</v-list-item-title>
                <v-list-item-subtitle>
                  Live calibration of the length measurement
                </v-list-item-subtitle>
                <v-list-item-action class="justify-end">
                  <v-btn
                    to="/config/length-calibration"
                    color="primary"
                    class="buttons"
                  >
                  <v-icon class="mr-1">mdi-ruler</v-icon>
                    Manage
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import axios from "axios";
import { mapState } from "vuex";
import calibrateScale from "@/components/calibrateScale.vue";

export default {
  name: "Configuration",
  components: {
    calibrateScale,
  },
  data: () => ({
    configData: {
      loadcell: {
        ip: "",
        port: "",
      },
    },
  }),
  computed: {
    ...mapState(["socket_instance"]),
  },
  methods: {
    setTare() {
      this.socket_instance.emit("set_tare", {});
    },
    setZero() {
      this.socket_instance.emit("set_zero", {});
    },
    getConfig() {
      axios
        .get("/api/config")
        .then((response) => {
          this.config = response.data;
        })
        .catch((error) => {
          console.log(error);
        });
    },
  },
};
</script>
<style lang="scss" scoped>
// .buttons {
//   margin: 5px 5px;
//   width: 130px;
// }
</style>
