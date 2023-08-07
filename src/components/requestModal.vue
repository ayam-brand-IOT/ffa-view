<template>
  <v-dialog persistent v-model="loading_dialog" width="300px">
    <v-card height="250px" class="pa-5">
      <!-- <v-card-title> -->
      <v-icon v-if="icon">{{ icon }}</v-icon>

      <div
        class="d-flex flex-column align-center justify-center"
        style="flex: 1"
      >
        <v-progress-circular
          v-if="status == status_codes.loading"
          :rotate="360"
          :size="100"
          :width="8"
          indeterminate
          color="primary"
        >
        </v-progress-circular>
        <template v-for="(response, index) in responses">
          <v-icon :color="response.color" size="100px" v-if="status == index">
            {{ response.icon }}
          </v-icon>
        </template>
        <span class="mt-4">
          <b>{{ message }}</b>
        </span>
      </div>
      <!-- </v-card-title> -->
      <!-- <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="close">Close</v-btn>
      </v-card-actions> -->
    </v-card>
  </v-dialog>
</template>
<script>
import config from "@/config";

export default {
  name: "requestModal",
  data: () => ({
    loading_dialog: false,
    message: "",
    icon: "",
    status: 0,
  }),
  computed: {
    responses: () => ({
      1: {
        icon: "mdi-check",
        color: "green",
        message: "Data loaded successfully",
      },
      2: {
        icon: "mdi-alert",
        color: "red",
        message: "Failed to load data",
      },
    }),
    status_codes: () => ({
      loading: 0,
      success: 1,
      fail: 2,
    }),
  },
  props: {
    onLoadingMessage: {
      type: String,
      default: "Loading...",
    },
    onFailMessage: {
      type: String,
      default: "Failed to load data",
    },
    onSuccessMessage: {
      type: String,
      default: "Data loaded successfully",
    },
  },
  methods: {
    testOnSuccess() {
      this.open();
      setTimeout(() => {
        this.success();
      }, 5000);
    },
    testOnFail() {
      this.open();
      setTimeout(() => {
        this.fail();
      }, 5000);
    },
    close() {
      this.loading_dialog = false;
    },
    delayedClose(time = 2000) {
      setTimeout(() => {
        this.close();
      }, time);
    },
    open() {
      this.loading_dialog = true;
      this.status = this.status_codes.loading;
      this.message = this.onLoadingMessage;
    },
    fail() {
      this.message = this.onFailMessage;
      this.status = this.status_codes.fail;

      setTimeout(() => {
        this.close();
      }, 2000);
    },
    success() {
      this.message = this.onSuccessMessage;
      this.status = this.status_codes.success;

      setTimeout(() => {
        this.close();
      }, 2000);
    },
  },
  mounted() {
    // this.testOnSuccess();
    // this.testOnFail();
  },
};
</script>
