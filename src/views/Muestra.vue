<template>
  <v-container>
    <div class="d-flex">
      <!-- back button -->
      <v-btn to="/history" size="x-large" variant="plain">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <h1>Details</h1>
    </div>
    <v-row v-if="muestra">
      <v-col class="" cols="9">
        <img
          class="the_fuckin_image"
          :src="`${url}:${url_port}/muestra_image/${muestra.image}`"
          crossorigin="anonymous"
        />
        <!-- ref="capturedImage" -->
      </v-col>
      <v-col cols="3">
        <h2>Information</h2>
        <div class="d-flex flex-column">
          <div class="mb-4">
            <b class="text-grey-darken-2">Lot #:</b>
            <h3 class="ml-3">{{ muestra.lot_no }}</h3>
          </div>
          <div class="mb-4">
            <b class="text-grey-darken-2">Analized date:</b>
            <h3 class="ml-3">{{ muestra.date }}</h3>
          </div>
          <div class="mb-4">
            <b class="text-grey-darken-2">Tail trigger:</b>
            <h3 class="ml-3">{{ muestra.tail_trigger }}</h3>
          </div>
          <div class="mb-4">
            <b class="text-grey-darken-2">No. of defects</b>
            <h3 class="ml-3">
              {{ muestra.defects ? muestra.defects.length : 0 }}
            </h3>
          </div>
        </div>
      </v-col>
    </v-row>
    <v-row v-if="muestra">
      <v-col cols="12" class="d-flex flex-column">
        <v-row>
          <v-col>
            <h3 class="text-center">Weight:</h3>
            <h2 class="text-center">{{ muestra.weight }}G</h2>
          </v-col>
          <v-col>
            <h3 class="text-center">Height:</h3>
            <h2 class="text-center">{{ muestra.height }}mm</h2>
          </v-col>
          <v-col>
            <h3 class="text-center">Weight:</h3>
            <h2 class="text-center">{{ muestra.length }}mm</h2>
          </v-col>
        </v-row>
        <!-- <h3 class="mb-2">Indicators</h3> -->
        <v-col cols="12" class="d-flex">
          <v-row>
            <v-col
              cols="2"
              v-for="(indicator, i) in indicators"
              class="d-flex flex-column align-center px-3 indicator-wrapper"
            >
              <span :class="`text-${indicator.status ? 'black' : 'grey'}`">
                {{ indicator.name }}
              </span>
              <div
                class="indicator"
                :class="indicator.status ? 'active' : 'inactive'"
              ></div>
            </v-col>
          </v-row>
        </v-col>
      </v-col>
    </v-row>
    <request-modal ref="requestModal" />
  </v-container>
</template>

<script>
import axios from "axios";
import config from "../config";
import requestModal from "@/components/requestModal.vue";

export default {
  name: "Muestra",
  data: () => ({
    muestra: null,
    indicators: [],
  }),
  components: {
    requestModal,
  },
  computed: {
    url_server: () => config.url_server(),
    url_port: () => config.url_port(),
    url: () => config.url(),
  },
  methods: {
    fetchData() {
      const { url, url_port, page } = this;
      this.$refs.requestModal.open();
      axios
        .get(`${url}:${url_port}/select/${this.$route.params.id}`)
        .then((response) => {
          this.muestra = response.data.data[0];

          this.$refs.requestModal.close(100);

          if (this.muestra.defects == null) return;
    
          const defect_ids = JSON.parse(`[${this.muestra.defects}]`);
          
          const defects = defect_ids.map((id) => {
            return this.indicators.find((indicator) => indicator.id == id).key;
          });
          
          defects.forEach((defect) => this.indicators[defect].status = true);

        })
        .catch((error) => {
          console.error(error);
          this.$refs.requestModal.fail();
        });
    },
  },
  mounted() {
    this.fetchData();

    var { defects } = config;

    Object.keys(defects).forEach((value, index) => {
      const { name, id } = defects[value];
      this.indicators.push({ name, status: false, key: value, id });
    });
    
  },
  watch: {
    muestra: function (val) {
      console.warn(val);
      // this.indicators = val.indicators;
    },
    "$route.params.id": function (val) {
      console.warn(val);
      this.fetchData();
    },
  },
};
</script>

<style scoped lang="scss">
.the_fuckin_image {
  object-fit: contain;
  width: 100%;
}

.inactive {
  background-color: red;
}
.active {
  background-color: greenyellow;
}

.indicator {
  width: 24px;
  height: 24px;
  border-radius: 12px;
}
</style>
