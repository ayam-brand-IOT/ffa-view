<template>
  <v-container style="height: 100%">
    <v-row style="height: 100%" justify="center">
      <v-col cols="10">
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
                <v-list-item-title>Export data</v-list-item-title>

                <v-list-item-subtitle>
                  Here you can export your data from the Lot # to excel
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <v-divider></v-divider>
            <p class="mt-4">Select the Lot# that you want to export its data</p>
            <lot-list ref="lots" selectable @rowClicked="selectedItem" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-btn
      @click="exportData()"
      :disabled="!selected_item"
      color="primary"
      class="download-button"
    >
      <v-icon>mdi-file-excel</v-icon>
      Export
    </v-btn>
    <requestModal ref="loadingModal" />
  </v-container>
</template>
<script>
import axios from "axios";
import config from "@/config";
import requestModal from "@/components/requestModal.vue";
import lotList from "@/components/lotList.vue";

export default {
  name: "LotInfo",
  components: {
    lotList,
    requestModal,
  },
  data: () => ({
    selected_item: null,
  }),
  computed: {
    url_port: () => config.url_port(),
    url: () => config.url(),
  },
  methods: {
    selectedItem(item) {
      this.selected_item = item;
    },
    async exportData() {
      this.$refs.loadingModal.open();

      const url = `${this.url}:${this.url_port}`;
      const end_point = `/download-lot-samples/${this.selected_item.lot_no}`;
      //192.168.1.62:3002/download-lot-samples/Hugo

      axios({
        url: `${url + end_point}`,
        method: "GET",
        responseType: "blob", // important
      }).then(
        (response) => {
          this.$refs.loadingModal.success();

          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `lot_${this.selected_item.lot_no}.xlsx`);
          document.body.appendChild(link);
          link.click();
        },
        (error) => {
          console.log(error);
          this.$refs.loadingModal.fail();
        }
      );
    },
  },
};
</script>
<style lang="scss" scoped>
.download-button {
  position: fixed;
  bottom: 60px;
  right: 20px;
}
</style>
