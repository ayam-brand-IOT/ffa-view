<template>
  <v-overlay class="help-container" v-model="showShortcuts">
    <v-card class="cmds-container">
      <div class="d-flex mb-7">
        <div>
          <h2>
            Keyboard Shortcuts
            <v-icon>mdi-keyboard-variant</v-icon>
          </h2>
          <small class="pl-1">Keyboard shortcuts</small>
        </div>

        <v-spacer></v-spacer>

        <v-icon @click="showShortcuts = false">mdi-close</v-icon>
      </div>

      <v-row style="height: 100%" class="px-5 pb-8">
        <v-col
          class="d-flex justify-space-between"
          cols="3"
          v-for="(command, index) in commandsList"
          :key="index"
        >
          <div class="text--grey">{{ command.description }}</div>

          <v-chip style="border-radius: 0 !important" tile>{{
            command.shortcut
          }}</v-chip>
        </v-col>
      </v-row>
    </v-card>
  </v-overlay>
</template>

<script>
import config from "@/config";

export default {
  data() {
    return {
      showShortcuts: false,
    };
  },

  props: {
    commandsList: {
      type: Array,
      required: true,
    },
  },
  mounted() {
    window.addEventListener("keydown", this.handleKeydown);
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.handleKeydown);
  },
  methods: {
    handleKeydown(e) {
      // Toggle the overlay when a certain key combination is pressed
      if (e.key == "?") {
        console.warn(e);
        // Example: Ctrl + K
        this.showShortcuts = !this.showShortcuts;
      }
    },
    open() {
      this.showShortcuts = true;
    },
  },
};
</script>

<style scoped lang="scss">
.help-container {
  display: flex;
  justify-content: center;
  align-items: center;

  .cmds-container {
    max-width: 800px;
    min-height: 200px;
    padding: 20px 20px;
  }
}
</style>
