<template>
  <v-app>
    <v-main class="main-container">
      <v-app-bar class="px-4">
        <v-toolbar-title class="h4-header">
          {{ this.$route.name }}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn text to="/">  <v-icon class="mr-2">mdi-package-variant-closed</v-icon>
          Lot Info</v-btn>
        <v-btn text to="/config"> <v-icon>mdi-cog</v-icon> Configuration</v-btn>


        <!-- <v-btn text to="/vision">Vision</v-btn>
        <v-btn text to="/loadcell">LoadCell</v-btn> -->
      </v-app-bar>
      <router-view />
      <div class="status_bar">
        <div class="d-flex align-center">
          <h5>Device Status</h5>
          :
          <u class="ml-2" :class="socket_status ? 'text-green' : 'text-red'">
            {{ socket_status ? "Connected" : "Disconnected" }}</u
          >
        </div>
        <v-spacer></v-spacer>
        <h5>{{ currentDateTime }}</h5>
      </div>
      <request-modal></request-modal>
    </v-main>
  </v-app>
</template>

<script>
import config from "./config";
import { mapState } from "vuex";
import io from "socket.io-client";
import requestModal from "./components/requestModal.vue";

const socket = io(config.url_server());

export default {
  name: "App",
  components: {
    requestModal,
  },
  computed: {
    ...mapState(["socket_instance"]),
  },
  data: () => ({
    socket_status: false,
    currentDateTime: "",
    //
  }),
  methods: {
    updateTime() {
      const date = new Date();
      const hours = this.formatTime(date.getHours());
      const minutes = this.formatTime(date.getMinutes());
      const seconds = this.formatTime(date.getSeconds());
      const day = this.formatTime(date.getDate());
      const month = this.formatTime(date.getMonth() + 1);
      const year = date.getFullYear();
      this.currentDateTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    },
    formatTime(time) {
      return time < 10 ? `0${time}` : time; // Add leading zero if time is less than 10
    },
  },
  mounted() {
    const { socket_instance } = this;

    socket.on("connect", () => {
      this.socket_status = true;
      console.warn("connected");
    });

    socket.on("disconnect", () => {
      this.socket_status = false;
      console.warn("disconnected");
    });

    this.$store.dispatch("setSocketInstance", socket);

    this.updateTime(); // Call the method to update the time immediately
    setInterval(this.updateTime, 1000); // Update the time every second
  },
};
</script>
<style>
.status_bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px;
  background-color: #c6bdbd;
  border-top: 1px solid #ccc;
  padding-left: 3%;
  padding-right: 3%;
  display: flex;
  /* justify-content: space-around; */
  align-items: center;
  z-index: 100;
}
.main-container {
  margin-bottom: 50px;
  display: flex;
}
.buttons {
  margin: 5px 5px;
  width: 130px;
}
</style>
