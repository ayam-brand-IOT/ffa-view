<template>
  <v-snackbar :color="type" v-model="snackbar" :timeout="timeout">
    {{ text }}

    <template v-slot:actions>
      <v-icon @click="close">mdi-close</v-icon>
    </template>
  </v-snackbar>
</template>

<script>
export default {
  name: "pushNotification",
  data: () => ({
    snackbar: false,
    timeout: 800,
    text: "Hello, I am a snackbar",
    type: "info",
  }),
  props: {
    // type: {
    //   type: String,
    //   default: "info",
    // },
    // text: {
    //   type: String,
    //   default: "Hello, I am a snackbar",
    // },
    // timeout:{
    //     type: Number,
    //     default: 800,
    // },
  },
  methods: {
    close() {
      this.snackbar = false;
    },
    push(text, type, timeout) {
      if (this.snackbar) this.close();
      // if exixts, use the new value, otherwise use the default value
      this.text = text || this.text;
      this.type = type || this.type;
      this.timeout = timeout || this.timeout;

      console.warn(this.text);

      this.snackbar = true;
    },
  },
};
</script>
