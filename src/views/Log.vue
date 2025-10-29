<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="10">
        <div class="d-flex mb-5">
          <!-- back button -->
          <v-btn @click="goBack" size="x-large" variant="plain">
            <v-icon>mdi-arrow-left</v-icon> Back
          </v-btn>

          <!-- <h1>Log</h1> -->
        </div>
        <div v-if="analyzing_lot" class="d-flex align-baseline">
          <div class="mb-3 ml-4">
            <h3>Lot #:</h3>
            <u @click="chooseLot" class="text-blue ml-1">
              {{ getAnalyzingLotNo }}
            </u>
          </div>

          <div class="mb-3 ml-4">
            <h3>Supplier:</h3>
            {{ analyzing_lot.supplier }}
          </div>

          <div class="mb-3 ml-4">
            <h3>Type</h3>
            {{ analyzing_lot.type }}
          </div>

          <div class="mb-3 ml-4">
            <h3>Specie</h3>
            {{ analyzing_lot.fish_species }}
          </div>

          <div class="mb-3 ml-4">
            <h3>Lot #:</h3>
            {{ analyzing_lot.production_date }}
          </div>

          <div class="mb-3 ml-4">
            <h3>Size: </h3>
            {{ analyzing_lot.size }}
          </div>

          <div class="mb-3 ml-4">
            <h3>Order no:</h3>
            {{ analyzing_lot.order_no }}
          </div>

          <!-- production date -->

          <div class="mb-3 ml-4">
            <h3>Production date:</h3>
            {{ analyzing_lot.production_date }}

          </div>

        </div>
        <v-tabs v-model="tab" background-color="transparent">
          <v-tab value="1">Log</v-tab>
          <v-tab value="2">Extra Images</v-tab>
          <v-tab value="3">Belly Resistence Test</v-tab>
        </v-tabs>
        <v-card class="pa-4">
          <v-window v-model="tab">
            <v-window-item value="1">
              <v-row>
                <v-col>
                  <v-data-table
                    :headers="headers"
                    :items="muestras"
                    :items-per-page="5"
                    class="elevation-1"
                  >
                    <template v-slot:item.image="{ item }">
                      <v-img
                        :src="`${url}:${url_port}/muestra_image/${item.columns.image}`"
                        width="150"
                        height="150"
                        contain
                      >
                      </v-img>
                    </template>
                    <template v-slot:item.actions="{ item }">
                      <v-btn
                        :to="`/muestra/${item.raw.id}`"
                        size="x-large"
                        variant="plain"
                      >
                        <v-icon>mdi-arrow-right</v-icon>
                      </v-btn>
                    </template>
                  </v-data-table>
                </v-col>
              </v-row>
            </v-window-item>
            <v-window-item value="2">
              <lot-images />
            </v-window-item>
            <v-window-item value="3">
              <broken-belly-list />
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>
    <request-modal ref="loadingModal" />
    <select-lot ref="selectLotModal" v-model="lot" />
  </v-container>
</template>
<script>
import axios from "axios";
import config from "../config";
import LotImages from "./LotImages.vue";
import { mapState, mapGetters } from "vuex";
import selectLot from "@/components/selectLot.vue";
import { VDataTable } from "vuetify/labs/VDataTable";
import requestModal from "@/components/requestModal.vue";
import BrokenBellyList from "@/components/BrokenBellyList.vue";

export default {
  name: "Log",
  data: () => ({
    muestras: [],
    page: 1,
    headers: [
      {
        title: "",
        align: "start",
        sortable: false,
        key: "image",
      },
      { title: "Weight", key: "weight" },
      { title: "Length", key: "length" },
      { title: "Height", key: "height" },
      {
        title: "",
        align: "end",
        sortable: false,
        key: "actions",
      },
    ],
    lot: "",
    tab: "1",
  }),
  components: {
    LotImages,
    selectLot,
    VDataTable,
    requestModal,
    BrokenBellyList,
  },
  computed: {
    ...mapState(["analyzing_lot"]),
    ...mapGetters(["getAnalyzingLotNo"]),
    url_server: () => config.url_server(),
    url_port: () => config.url_port(),
    url: () => config.url(),
  },
  methods: {
    goBack() {
      // Check if we came from lot-info
      if (this.$route.query.from === 'lot-info') {
        this.$router.push('/config/lot-info');
      } else {
        // Default back to analyse-lot
        this.$router.push('/analyse-lot');
      }
    },
    chooseLot() {
      this.$refs.selectLotModal.open_select = true;
    },
    fetchData() {
      const { url, page, url_port } = this;
      const lot_no = this.getAnalyzingLotNo;
      const get_request = `${url}:${url_port}/lot_samples/${lot_no}`;

      console.warn();
      this.$refs.loadingModal.open();
      console.warn(get_request);
      axios
        .get(get_request, { withCredentials: false })
        .then((response) => {
          console.warn(response.data.data);
          this.muestras = response.data.data;
          // transforming iso date to human readable date
          this.muestras.forEach((muestra) => {
            muestra.date = new Date(muestra.date).toLocaleDateString();
          });
          this.$refs.loadingModal.close(100);
        })
        .catch((error) => {
          console.log(error);
          this.$refs.loadingModal.fail();
        });
    },
  },
  mounted() {
    if (this.getAnalyzingLotNo == config.NO_LOT_SELECTED) {
      this.$refs.selectLotModal.should_persist = true;
      console.warn("Please select a lot to analyze");
      this.chooseLot();
    } else {
      this.fetchData();
    }
  },
  watch: {
    page() {
      this.fetchData();
    },
    lot: {
      handler: function (newVal, oldVal) {
        console.warn("lot changed", newVal, oldVal);
        this.$store.dispatch("setAnalyzingLot", newVal);
        if (newVal == null) {
          this.$refs.selectLotModal.should_persist = true;
          this.chooseLot();
        } else {
          this.fetchData();
        }
      },
      deep: true,
    },
  },
};
</script>
<style scoped lang="scss"></style>