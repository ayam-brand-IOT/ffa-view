<template>
  <div
    class="image-container"
    :style="{ aspectRatio: `${frame.width} / ${frame.height}` }"
    @click="handleClick"
  >
    <img
      :src="`${url_server}video_feed`"
      alt="Image"
      class="background-image"
    />
    <div v-if="points.length === 2" class="square" :style="squareStyle"></div>
    <div
      v-for="(point, index) in points"
      :key="index"
      class="point"
      :style="{ left: pct(point.x, frame.width), top: pct(point.y, frame.height) }"
    ></div>
    <!-- Shows point coordinates (camera frame pixels) in the bottom-right corner -->
    <div v-if="points.length > 0" class="coordinates">
      <div v-for="(point, index) in points" :key="'coords' + index">
        Point {{ index + 1 }}: X: {{ point.x }}, Y: {{ point.y }}
      </div>
    </div>
  </div>
</template>

<script>
import config from "../config";
import { FALLBACK_GEOMETRY, fetchVisionGeometry } from "./visionGeometry";

export default {
  data() {
    return {
      points: [], // The two clicks, in camera frame pixels
      frame: { ...FALLBACK_GEOMETRY },
    };
  },
  computed: {
    squareStyle() {
      const [a, b] = this.points;
      return {
        left: this.pct(Math.min(a.x, b.x), this.frame.width),
        top: this.pct(Math.min(a.y, b.y), this.frame.height),
        width: this.pct(Math.abs(b.x - a.x), this.frame.width),
        height: this.pct(Math.abs(b.y - a.y), this.frame.height),
      };
    },
    url_server: () => config.url_server(),
    url_port: () => config.url_port(),
    url: () => config.url(),
  },
  async mounted() {
    try {
      this.frame = await fetchVisionGeometry();
    } catch (error) {
      console.error("Could not read the camera frame size:", error);
    }
  },
  methods: {
    pct(value, total) {
      return `${(value / total) * 100}%`;
    },
    handleClick(event) {
      // The image is shown scaled; convert the click to camera frame pixels
      const rect = this.$el.getBoundingClientRect();
      const x = Math.round(((event.clientX - rect.left) * this.frame.width) / rect.width);
      const y = Math.round(((event.clientY - rect.top) * this.frame.height) / rect.height);
      const point = {
        x: Math.min(Math.max(x, 0), this.frame.width),
        y: Math.min(Math.max(y, 0), this.frame.height),
      };

      // Add point or reset if two points already exist
      if (this.points.length < 2) {
        this.points.push(point);
      } else {
        this.points = [point];
      }
    },
    reset() {
      this.points = [];
    },
  },
  watch: {
    points: {
      handler() {
        // Emit event with the coordinates of the two points
        if (this.points.length === 2 || this.points.length === 0) {
          this.$emit("onFinish", this.points);
        }
      },
      deep: true,
    },
  },
};
</script>

<style scoped>
.image-container {
  position: relative;
  width: 100%;
  max-width: 1000px;
  cursor: crosshair;
}

.background-image {
  display: block;
  width: 100%;
  height: 100%;
}
.point {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: red;
  transform: translate(-50%, -50%);
}

.coordinates {
  position: absolute;
  right: 10px;
  bottom: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 10px;
  border-radius: 8px;
}

.square {
  position: absolute;
  border: 2px solid red;
  pointer-events: none;
}
</style>
