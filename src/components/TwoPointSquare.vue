<template>
  <div class="image-container" @click="handleClick">
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
      :style="{ left: point.x + 'px', top: point.y + 'px' }"
    ></div>
    <!-- Shows point coordinates in the bottom-right corner -->
    <div v-if="points.length > 0" class="coordinates">
      <div v-for="(point, index) in points" :key="'coords' + index">
        Point {{ index + 1 }}: X: {{ point.x }}, Y: {{ point.y }}
      </div>
    </div>
  </div>
</template>

<script>
import config from "../config";

export default {
  data() {
    return {
      points: [], // Stores the coordinates of the two clicks
    };
  },
  computed: {
    squareStyle() {
      const x1 = this.points[0].x;
      const y1 = this.points[0].y;
      const x2 = this.points[1].x;
      const y2 = this.points[1].y;

      const left = Math.min(x1, x2) + "px";
      const top = Math.min(y1, y2) + "px";
      const width = Math.abs(x2 - x1) + "px";
      const height = Math.abs(y2 - y1) + "px";

      return { left, top, width, height };
    },
    url_server: () => config.url_server(),
    url_port: () => config.url_port(),
    url: () => config.url(),
  },
  methods: {
    handleClick(event) {
      // Calculate coordinates relative to the image container
      const rect = this.$el.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Add point or reset if two points already exist
      if (this.points.length < 2) {
        this.points.push({ x, y });
      } else {
        this.points = [{ x, y }];
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
  max-width: 1000px;
  max-height: 650px;
  cursor: crosshair;
}

.background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
