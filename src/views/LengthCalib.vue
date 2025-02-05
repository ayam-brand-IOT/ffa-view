<template>
  <v-container class="length-calib" style="height: 100%">
    <v-row style="height: 100%" justify="center">
      <v-col cols="11">
        <div class="d-flex mb-5">
          <!-- back button -->
          <router-link to="/config" size="x-large" variant="plain">
            <v-icon>mdi-arrow-left</v-icon> Back
          </router-link>
          <!-- <h1>History</h1> -->
        </div>
        <v-card elevation="2">
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title>
                  Calibrate vision measurement
                </v-list-item-title>

                <v-list-item-subtitle class="instructions">
                  Use the left and right arrow keys to move the lines pixel by pixel, or hold Shift while pressing the arrow keys to move them 10 pixels at a time. Once the lines are in the desired position, enter the distance in cm, press Enter to set each line, and click on Calibrate to finalize the process
                </v-list-item-subtitle>
                <v-list-item-action class="justify-end">
                  <v-btn
                    @click="resetLineSelector()"
                    color="red"
                    class="buttons"
                  >
                    <v-icon>mdi-weight-gram</v-icon>
                    Reset
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
            </v-list>
            <v-divider></v-divider>
            <!-- <p class="mt-4">List of providers</p> -->
            <div class="content-wrapper">
              <v-col class="d-flex justify-center" cols="12">
                <!-- <img
                  class="the_fuckin_image elevation-2"
                  :src="`${url_server}video_feed`"
                  crossorigin="anonymous"
                  ref="liveImage"
                /> -->
                <moving-line @onFinish="handlePXdistance" ref="lineSelector" />
              </v-col>
            </div>

            <v-row v-show="amountOfPixels" class="align-center">
              <v-col>
                <v-text-field
                  label="Distance on pixels"
                  variant="underlined"
                  :disabled="true"
                  :focused="true"
                >
                  {{ this.amountOfPixels }}
                </v-text-field>
              </v-col>
              <v-col>
                <v-text-field
                  v-model="distanceOnMm"
                  label="Distance on cm"
                  variant="underlined"
                  :focused="true"
                />
              </v-col>
              <v-btn
                @click="saveData()"
                color="success"
                class="buttons"
                :disabled="canBeSubmitted"
              >
                <v-icon>mdi-weight-gram</v-icon>
                calibrate
              </v-btn>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import axios from "axios";
import MovingLine from "@/components/MovingLine.vue";
import config from "@/config";
import { mapState } from "vuex";
import { mapGetters } from "vuex";

export default {
  name: "LotInfo",
  components: {
    MovingLine,
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
    ...mapState({
      // config: state => state.config
    }),
    ...mapGetters({
      // config: 'config'
    }),
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
      const calculo_magico = this.distanceOnMm/ this.amountOfPixels;
      const jsonData = { ratio: calculo_magico };

      this.submitRequest(jsonData);
    },
    async submitRequest(jsonData) {
      // const loading = this.$loading();
      axios
        .post(`${this.url_server}length_calibration`, jsonData, {
          withCredentials: false,
          headers: {
            Accept: "application/json",
          },
        })
        .then(
          (response) => {
            // this.confirm = false;
            // this.reset();
            //console.log(response.data);
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
  },
};
</script>
<style lang="scss">
.length-calib{
  .instructions {
      -webkit-line-clamp:none !important;
   }
}
</style>
<style lang="scss" scoped>
.the_fuckin_image {
  width: 100%;
  min-width: 100%;
  min-height: 100%;
  border: solid 1px gray;
  border-radius: 5px;
  background-color: gray;
  /* height: 300px; */
}
.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
