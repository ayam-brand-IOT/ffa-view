<template>
  <v-container>
    <v-row justify="center">
      <div class="d-flex flex-wrap" style="min-height: 80vh; width: 100%;">
        <v-col
          class="d-flex flex-column align-center"
          v-for="lotImage in images"
          cols="4"
        >
          <v-card class="image-card">
            <v-img
              :src="urlImage(lotImage.image)"
              width="100%"
              height="100%"
              cover
            ></v-img>
          </v-card>
        </v-col>
      </div>
    </v-row>
    <request-modal ref="loadingModal" />
  </v-container>
</template>
<script>
import axios from "axios";
import config from "@/config";
import { mapGetters, mapState } from "vuex";
import requestModal from "@/components/requestModal.vue";

export default {
  name: "LotImages",
  components: {
    requestModal,
  },
  computed: {
    ...mapGetters(["getAnalyzingLotNo"]),
    url_port: () => config.url_port(),
    url: () => config.url(),
  },
  data: () => ({
    images: [],
  }),
  methods: {
    fetchData() {
      const { url, page, url_port } = this;
      const lot_no = this.getAnalyzingLotNo;
      console.warn(lot_no);
      const get_request = `${url}${url_port}/lot_images/${lot_no}`;

      console.warn();
      this.$refs.loadingModal.open();
      axios
        .get(get_request)
        .then((response) => {
          console.warn(response.data.data);
          this.images = response.data.data;
          this.$refs.loadingModal.close(100);
        })
        .catch((error) => {
          console.log(error);
          this.$refs.loadingModal.fail();
        });
    },
    urlImage(lotImage) {
      const { url, url_port } = this;
      const image_url = `${url}${url_port}/lot_image/${lotImage}`;
      return image_url;
    },
  },
  mounted() {
    this.fetchData();
  },
};
</script>
<style lang="scss" scoped>
.image-card {
  margin: 5px 5px;
  padding: 10px;
  width: 250px;
  height: 250px;
  border-radius: 10px;
}
</style>
