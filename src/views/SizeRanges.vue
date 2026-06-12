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
            <v-icon class="mr-2" color="primary">mdi-ruler</v-icon>
            Acceptable Length Ranges by Size
          </v-card-title>
          <v-card-text>
            <p class="mb-4 text-medium-emphasis">
              Set the minimum and maximum acceptable length (cm) for each size.
              When a new sample is saved, it is marked as in/out of spec based on
              the range for its lot's size.
            </p>

            <v-progress-linear
              v-if="loading"
              indeterminate
              color="primary"
              class="mb-4"
            ></v-progress-linear>

            <v-form ref="form" @submit.prevent="save">
              <div
                v-for="size in sizeKeys"
                :key="size"
                class="mb-2"
              >
                <v-row align="center">
                  <v-col cols="12" sm="4">
                    <v-chip color="primary" label class="font-weight-bold">
                      <v-icon start>mdi-fish</v-icon>
                      {{ size }}
                    </v-chip>
                  </v-col>
                  <v-col cols="6" sm="4">
                    <v-text-field
                      v-model.number="ranges[size].length_min"
                      label="Min length"
                      type="number"
                      suffix="cm"
                      variant="underlined"
                      :rules="[rangeRule(size)]"
                      hide-details="auto"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="6" sm="4">
                    <v-text-field
                      v-model.number="ranges[size].length_max"
                      label="Max length"
                      type="number"
                      suffix="cm"
                      variant="underlined"
                      :rules="[rangeRule(size)]"
                      hide-details="auto"
                    ></v-text-field>
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
                  @click="getRanges"
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

const SIZE_KEYS = ["TALL", "JITNEY", "BUFFET"];

export default {
  name: "SizeRanges",
  data: () => ({
    loading: false,
    sizeKeys: SIZE_KEYS,
    ranges: {
      TALL:   { length_min: null, length_max: null },
      JITNEY: { length_min: null, length_max: null },
      BUFFET: { length_min: null, length_max: null },
    },
    snackbar: { show: false, text: "", color: "success" },
  }),
  computed: {
    url_port: () => config.url_port(),
    url: () => config.url(),
  },
  methods: {
    rangeRule(size) {
      return () => {
        const r = this.ranges[size];
        if (r.length_min == null || r.length_max == null) return true;
        return Number(r.length_max) >= Number(r.length_min) || "Max must be ≥ Min";
      };
    },
    getRanges() {
      this.loading = true;
      const url = `${this.url}:${this.url_port}`;
      axios
        .get(`${url}/size-ranges`)
        .then((response) => {
          const sizes = response.data?.sizes ?? {};
          SIZE_KEYS.forEach((size) => {
            this.ranges[size] = {
              length_min: sizes[size]?.length_min ?? null,
              length_max: sizes[size]?.length_max ?? null,
            };
          });
        })
        .catch((error) => {
          console.log(error);
          this.notify("Failed to load ranges", "error");
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
        .post(`${url}/size-ranges`, { sizes: this.ranges })
        .then(() => {
          this.notify("Ranges saved", "success");
        })
        .catch((error) => {
          console.log(error);
          this.notify("Failed to save ranges", "error");
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
    this.getRanges();
  },
};
</script>
<style lang="scss" scoped></style>
