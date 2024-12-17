<template>
  <v-dialog persistent v-model="show" width="40%">
    <v-card height="100%" class="pa-5">
      <!-- show Image preview -->
      <v-img
        v-if="imagePreview"
        :src="imagePreview"
        width="100%"
        class="mx-auto"
      ></v-img>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="warning" text @click="close">Close</v-btn>
        <v-btn color="primary" text @click="add">Add</v-btn>
      </v-card-actions>
    </v-card>
    <request-modal ref="loadingModal" />
  </v-dialog>
</template>
<script>
import axios from "axios";
import config from "@/config";
import { mapState, mapGetters } from "vuex";
import requestModal from "./requestModal.vue";

export default {
  name: "previewExtraImage",
  props: {
    image: {
      type: Blob,
      required: true,
    },
  },
  components: {
    requestModal,
  },
  data: () => ({
    imagePreview: null,
    show: false,
  }),
  computed: {
    ...mapGetters(["getAnalyzingLotNo"]),
    url_server: () => config.url_server(),
    url_port: () => config.url_port(),
    url: () => config.url(),
  },
  methods: {
    previewImage() {
      const reader = new FileReader();
      reader.readAsDataURL(this.image);
      reader.onload = (e) => {
        this.imagePreview = e.target.result;
      };
    },
    open() {
      this.show = true;
    },
    close() {
      this.show = false;
    },
    cancel() {
      this.$emit("close");
    },
    add() {
      // this.$emit("add");
      this.saveData();
    },
    saveData() {
      this.saveDialog = false;

      const { imagePreview, getAnalyzingLotNo } = this;
      // file name with datetime stamp
      const filename = `${getAnalyzingLotNo}-${new Date().getTime()}.jpg`;

      //
      // Split the Data URL into two parts: the header and the base64-encoded data
      const [header, base64Data] = imagePreview.split(",");

      // Determine the content type of the file from the Data URL header
      const contentType = header.match(/:(.*?);/)[1];

      // Convert the base64 data to binary data
      const binaryData = atob(base64Data);

      // Create a typed array to hold the binary data
      const arrayBuffer = new ArrayBuffer(binaryData.length);
      const uint8Array = new Uint8Array(arrayBuffer);

      // Copy the binary data to the typed array
      for (let i = 0; i < binaryData.length; i++) {
        uint8Array[i] = binaryData.charCodeAt(i);
      }

      //
      const file = new File([uint8Array], filename, { type: contentType });

      const formData = new FormData();
      formData.append("lot_no", getAnalyzingLotNo);
      formData.append("image", file); // Append the image data URL

      this.submitRequest(formData);
    },

    async submitRequest(formData) {
      // const loading = this.$loading();
      this.$refs.loadingModal.open();
      axios
        .post(`${this.url}:${this.url_port}/add-lot-image`, formData, {
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        })
        .then(
          (response) => {
            this.$refs.loadingModal.success();
            this.$emit("close");
          },
          (error) => {
            console.log(error);
            this.$refs.loadingModal.fail();
          }
        );
    },
  },
  watch: {
    image: function (val) {
      console.warn("image changed");
      if (val) this.previewImage();
    },
  },
};
</script>
