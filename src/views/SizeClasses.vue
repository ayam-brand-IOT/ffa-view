<template>
  <v-container style="height: 100%">
    <v-row style="height: 100%" justify="center">
      <v-col cols="10">
        <div class="d-flex mb-5">
          <router-link to="/config" size="x-large" variant="plain">
            <v-icon>mdi-arrow-left</v-icon> Back
          </router-link>
        </div>

        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-scale</v-icon>
            Size by Weight
          </v-card-title>
          <v-card-text>
            <p class="mb-4 text-medium-emphasis">
              Each fish is sized by its weight when it is saved. A size starts at
              its weight and runs up to the next size; TALL has no upper limit.
              A fish lighter than JITNEY is rejected. Changes apply to fish saved
              from now on.
            </p>

            <v-progress-linear
              v-if="loading"
              indeterminate
              color="primary"
              class="mb-4"
            ></v-progress-linear>

            <v-form ref="form" @submit.prevent="save">
              <div class="mb-2">
                <v-row align="center">
                  <v-col cols="12" sm="4">
                    <v-chip color="error" label class="font-weight-bold">
                      <v-icon start>mdi-close-circle</v-icon>
                      REJECTED
                    </v-chip>
                  </v-col>
                  <v-col cols="12" sm="8" class="text-body-1">
                    {{ rangeText(-1) }}
                  </v-col>
                </v-row>
                <v-divider class="mt-3"></v-divider>
              </div>

              <div v-for="(entry, i) in sizes" :key="entry.size" class="mb-2">
                <v-row align="center">
                  <v-col cols="12" sm="4">
                    <v-chip color="primary" label class="font-weight-bold">
                      <v-icon start>mdi-fish</v-icon>
                      {{ entry.size }}
                    </v-chip>
                  </v-col>
                  <v-col cols="6" sm="4">
                    <v-text-field
                      v-model.number="entry.weight_min"
                      label="From"
                      type="number"
                      suffix="g"
                      variant="underlined"
                      :rules="[startRule(i)]"
                      hide-details="auto"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="6" sm="4" class="text-body-1">
                    {{ rangeText(i) }}
                  </v-col>
                </v-row>
                <v-divider class="mt-3"></v-divider>
              </div>

              <div class="d-flex justify-end mt-4">
                <v-btn
                  color="grey"
                  variant="outlined"
                  class="mr-2"
                  :disabled="loading"
                  @click="getClasses"
                >
                  <v-icon start>mdi-refresh</v-icon>
                  Reset
                </v-btn>
                <v-btn
                  color="primary"
                  type="submit"
                  :loading="loading"
                >
                  <v-icon start>mdi-content-save</v-icon>
                  Save
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2500">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>
<script>
import axios from "axios";
import config from "@/config";

// Lightest to heaviest, as the server classifies them.
const SIZE_KEYS = ["JITNEY", "BUFFET", "TALL"];

export default {
  name: "SizeClasses",
  data: () => ({
    loading: false,
    sizes: SIZE_KEYS.map((size) => ({ size, weight_min: null })),
    snackbar: { show: false, text: "", color: "success" },
  }),
  computed: {
    url_port: () => config.url_port(),
    url: () => config.url(),
  },
  methods: {
    isWhole(value) {
      return Number.isInteger(value) && value > 0;
    },
    startRule(i) {
      return () => {
        const value = this.sizes[i].weight_min;
        if (!this.isWhole(value)) return "Whole grams above 0";
        const prev = this.sizes[i - 1];
        if (prev && this.isWhole(prev.weight_min) && value <= prev.weight_min) {
          return `Must be above ${prev.size}`;
        }
        return true;
      };
    },
    // Range covered by size i; -1 is REJECTED.
    rangeText(i) {
      const start = i < 0 ? null : this.sizes[i].weight_min;
      const next = this.sizes[i + 1]?.weight_min;
      if (i < 0) return this.isWhole(next) ? `Below ${next} g` : "—";
      if (!this.isWhole(start)) return "—";
      if (next === undefined) return `${start} g and above`;
      return this.isWhole(next) ? `${start} – ${next - 1} g` : "—";
    },
    getClasses() {
      this.loading = true;
      const url = `${this.url}:${this.url_port}`;
      axios
        .get(`${url}/size-classes`)
        .then((response) => {
          const stored = response.data?.sizes ?? [];
          this.sizes = SIZE_KEYS.map((size) => ({
            size,
            weight_min: stored.find((e) => e.size === size)?.weight_min ?? null,
          }));
        })
        .catch((error) => {
          console.log(error);
          this.notify("Failed to load sizes", "error");
        })
        .finally(() => {
          this.loading = false;
        });
    },
    async save() {
      const { valid } = await this.$refs.form.validate();
      if (!valid) return;

      this.loading = true;
      const url = `${this.url}:${this.url_port}`;
      axios
        .post(`${url}/size-classes`, { sizes: this.sizes })
        .then(() => {
          this.notify("Sizes saved", "success");
        })
        .catch((error) => {
          console.log(error);
          this.notify(error.response?.data?.error || "Failed to save sizes", "error");
        })
        .finally(() => {
          this.loading = false;
        });
    },
    notify(text, color) {
      this.snackbar = { show: true, text, color };
    },
  },
  mounted() {
    this.getClasses();
  },
};
</script>
<style lang="scss" scoped></style>
