<template>
  <v-container style="height: 100%">
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
                  2 Point Calibration Zone of Interest
                </v-list-item-title>

                <v-list-item-subtitle>
                  Select 2 points in the image to calibrate the zone of interest
                </v-list-item-subtitle>
                <v-list-item-action class="justify-end">
                  <v-btn
                    @click="resetSquareSelector()"
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
                <TwoPointSquare
                  @onFinish="handle2Points"
                  ref="SquareSelector"
                />
              </v-col>
            </div>

            <v-row v-show="twoPoints.length == 2" class="align-center">
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
import TwoPointSquare from "@/components/TwoPointSquare.vue";
import config from "@/config";
import { mapState } from "vuex";
import { mapGetters } from "vuex";

export default {
  name: "LotInfo",
  components: {
    TwoPointSquare,
  },
  data() {
    return {
      twoPoints: [],
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
      return !(this.twoPoints.length === 2);
    },
  },
  methods: {
    resetSquareSelector() {
      this.$refs.SquareSelector.reset();
    },
    handle2Points(points) {
      this.twoPoints = points;
      console.log("points", points);
    },
    saveData() {
      this.submitRequest(this.twoPoints);
    },
    async submitRequest(jsonData) {
      // const loading = this.$loading();
      axios
        .post(`${this.url_server}calibrate_zoi`, jsonData, {
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
  mounted() {},
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
  /* height: 300px; */
}
.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
