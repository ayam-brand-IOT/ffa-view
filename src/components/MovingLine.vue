<template>
  <div class="image-container" @keydown="handleKeyPress" tabindex="0">
    <img
      :src="`${url_server}video_feed`"
      alt="Your Image"
      class="background-image"
    />
    <div
      v-if="line1Position === null || line2Position == null"
      class="vertical-line"
      :style="{ left: currentPosition + 'px' }"
    ></div>
    <div class="position-display">X: {{ currentPosition }} px</div>
    <div
      v-if="line1Position !== null"
      class="vertical-line"
      :style="{ left: line1Position + 'px' }"
    ></div>
    <div
      v-if="line2Position !== null"
      class="vertical-line"
      :style="{ left: line2Position + 'px' }"
    ></div>
    <div
      v-if="line1Position !== null"
      style="bottom: 60px"
      class="position-display"
    >
      Línea 1: {{ line1Position }} px
    </div>
    <div
      v-if="line2Position !== null"
      class="position-display"
      style="bottom: 100px"
    >
      Línea 2: {{ line2Position }} px
    </div>
    <div
      v-if="line2Position !== null"
      class="position-display"
      style="left: 15%"
    >
      Distancia: {{ Math.abs(line2Position - line1Position) }} px
    </div>
  </div>
</template>

<script>
import config from "../config";

export default {
  data() {
    return {
      currentPosition: 500, // Start in the middle of the image
      line1Position: null,
      line2Position: null,
      distanceField: null,
    };
  },
  computed: {
    url_server: () => config.url_server(),
    url_port: () => config.url_port(),
    url: () => config.url(),
  },
  methods: {
    moveLeft(amount) {
      if (this.currentPosition > 0) {
        this.currentPosition -= amount; // Move 10px to the left
      }
    },
    moveRight(amount) {
      if (this.currentPosition < 1000) {
        this.currentPosition += amount; // Move 10px to the right
      }
    },
    handleKeyPress(event) {
      // La cantidad de píxeles a moverse depende de si Shift está presionado
      const moveAmount = event.shiftKey ? 10 : 1;

      switch (event.key) {
        case "ArrowLeft":
          this.moveLeft(moveAmount);
          break;
        case "ArrowRight":
          this.moveRight(moveAmount);
          break;
        case "Enter":
          this.fixLinePosition();
          break;
      }
    },
    fixLinePosition() {
      if (this.line1Position === null) {
        this.line1Position = this.currentPosition;
        this.currentPosition = 500; // Reset the current position
      } else if (this.line2Position === null) {
        this.line2Position = this.currentPosition;
      }
    },
    reset() {
      this.line1Position = null;
      this.line2Position = null;
      this.currentPosition = 500;
    },
  },
  mounted() {
    this.$el.focus(); // Focus on the container to listen for key events
  },
  watch: {
    line2Position(newValue) {
      this.$emit("onFinish", {
        distance: Math.abs(this.line2Position - this.line1Position),
      });
    },
  },
};
</script>

<style scoped>
.image-container {
  position: relative;
  width: 1000px;
  height: 650px;
  outline: none; /* Remove blue outline from focused div */
}

.background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vertical-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: red;
}

.position-display {
  position: absolute;
  bottom: 10px;
  left: 10px;
  color: white;
  font-size: 16px;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px;
}
</style>
