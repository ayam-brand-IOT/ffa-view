<template>
  <div v-if="total" class="d-flex flex-wrap align-center ga-2">
    <span class="text-body-2 text-medium-emphasis mr-1">Sizes:</span>
    <v-chip
      v-for="row in rows"
      :key="row.size"
      :color="row.size === 'REJECTED' ? 'error' : 'primary'"
      :variant="row.predominant ? 'flat' : 'tonal'"
      size="small"
      label
    >
      <v-icon v-if="row.predominant" start>mdi-star</v-icon>
      {{ row.size }} · {{ row.count }} ({{ row.pct }}%)
    </v-chip>
  </div>
</template>
<script>
// Lightest to heaviest, then the rejected fish.
const ORDER = ["JITNEY", "BUFFET", "TALL", "REJECTED"];

export default {
  name: "SizeBreakdown",
  props: {
    samples: { type: Array, default: () => [] },
  },
  computed: {
    total() {
      return this.samples.filter((s) => ORDER.includes(s.size)).length;
    },
    rows() {
      const counts = ORDER.map((size) => this.samples.filter((s) => s.size === size).length);
      // Rejected fish do not compete for the predominant size.
      const best = Math.max(...counts.slice(0, 3));
      return ORDER.map((size, i) => ({
        size,
        count: counts[i],
        pct: ((counts[i] / this.total) * 100).toFixed(0),
        predominant: size !== "REJECTED" && best > 0 && counts[i] === best,
      })).filter((row) => row.count > 0);
    },
  },
};
</script>
