<template>
  <Line ref="pgc" :data="chartData" :options="chartOptions" />
</template>

<script>
// DataPage.vue
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default {
  name: "LineChart",
  components: { Line },
  props: {
    labels: {
      type: Object,
      required: true,
    },
    data: {
      type: Object,
      required: true,
    },
  },
  computed: {
    chartData() {
      return {
        labels: [],
        datasets: [
          {
            label: "Data One",
            backgroundColor: "#f87979",
            data: [],
          },
        ],
      };
    },
    chartOptions() {
      return {};
    },
  },
  methods: {
    update() {
      this.$refs.pgc.chart.update();
    },
  },
  watch: {
    data() {
      this.$refs.pgc.chart.data.labels = this.labels;
      this.$refs.pgc.chart.data.datasets[0].data = this.data;
      this.update();
    },
  },
};
</script>
