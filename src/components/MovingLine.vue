<template>
  <div
    class="image-container"
    :style="{ aspectRatio: `${frame.width} / ${frame.height}` }"
    @keydown="handleKeyPress"
    tabindex="0"
  >
    <img
      :src="`${url_server}video_feed`"
      alt="Your Image"
      class="background-image"
    />
    <div
      v-if="line1Position === null || line2Position == null"
      class="vertical-line"
      :style="{ left: pct(currentPosition) }"
    ></div>
    <div class="position-display">X: {{ currentPosition }} px</div>
    <div
      v-if="line1Position !== null"
      class="vertical-line"
      :style="{ left: pct(line1Position) }"
    ></div>
    <div
      v-if="line2Position !== null"
      class="vertical-line"
      :style="{ left: pct(line2Position) }"
    ></div>
    <div
      v-if="line1Position !== null"
      style="bottom: 60px"
      class="position-display"
    >
      Line 1: {{ line1Position }} px
    </div>
    <div
      v-if="line2Position !== null"
      class="position-display"
      style="bottom: 100px"
    >
      Line 2: {{ line2Position }} px
    </div>
    <div
      v-if="line2Position !== null"
      class="position-display"
      style="left: 15%"
    >
      Distance: {{ Math.abs(line2Position - line1Position) }} px
    </div>
  </div>
</template>

<script>
import config from "../config";
import { FALLBACK_GEOMETRY, fetchVisionGeometry } from "./visionGeometry";

// Positions are camera frame pixels, so the distance sent for the mm/px
// calibration is the one the analysis measures, at any display size.
export default {
  data() {
    return {
      frame: { ...FALLBACK_GEOMETRY },
      currentPosition: FALLBACK_GEOMETRY.width / 2, // Start in the middle of the image
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
    pct(position) {
      return `${(position / this.frame.width) * 100}%`;
    },
    moveLeft(amount) {
      this.currentPosition = Math.max(0, this.currentPosition - amount);
    },
    moveRight(amount) {
      this.currentPosition = Math.min(this.frame.width - 1, this.currentPosition + amount);
    },
    handleKeyPress(event) {
      // Move amount depends on whether Shift is held
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
        this.currentPosition = this.frame.width / 2; // Reset the current position
      } else if (this.line2Position === null) {
        this.line2Position = this.currentPosition;
      }
    },
    reset() {
      this.line1Position = null;
      this.line2Position = null;
      this.currentPosition = this.frame.width / 2;
    },
  },
  async mounted() {
    this.$el.focus(); // Focus on the container to listen for key events
    try {
      this.frame = await fetchVisionGeometry();
      if (this.line1Position === null) this.currentPosition = this.frame.width / 2;
    } catch (error) {
      console.error("Could not read the camera frame size:", error);
    }
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
  width: 100%;
  max-width: 1000px;
  outline: none; /* Remove blue outline from focused div */
}

.background-image {
  display: block;
  width: 100%;
  height: 100%;
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
