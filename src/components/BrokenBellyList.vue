<template>
  <v-container>
      <v-table>
        <thead>
          <tr>
            <th width="120px" class="text-left">Lot #</th>
            <th class="text-left">Resistence</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in brokenBellyList" :key="item.break_point">
            <td>{{ item.lot_no }}</td>
            <td>{{ item.break_point }}</td>
          </tr>
        </tbody>
      </v-table>
    <request-modal ref="loadingModal" />
  </v-container>
</template>
<script>
import axios from "axios";
import config from "@/config";
import { mapGetters } from "vuex";
import requestModal from "./requestModal.vue";

export default {
  name: "BrokenBellyList",
  components: {
    requestModal,
  },
  data: () => ({
    brokenBellyList: [],
  }),
  computed: {
    ...mapGetters(["getAnalyzingLotNo"]),
    url_port: () => config.url_port(),
    url: () => config.url(),
  },
  methods: {
    fetchData() {
      const { url, url_port } = this;
      const lot_no = this.getAnalyzingLotNo;
      console.warn(lot_no);
      const get_request = `${url}:${url_port}/lot_tension/${lot_no}`;

      console.warn();
      this.$refs.loadingModal.open();
      axios
        .get(get_request)
        .then((response) => {
          console.warn(response.data.data);
          this.brokenBellyList = response.data.data;
          this.$refs.loadingModal.close(100);
        })
        .catch((error) => {
          console.log(error);
          this.$refs.loadingModal.fail();
        });
    },
  },
  mounted() {
    this.fetchData();
  },
};
</script>
<style lang="scss" scoped></style>
