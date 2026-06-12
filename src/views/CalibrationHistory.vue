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
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title>Calibration History</v-list-item-title>
                <v-list-item-subtitle>
                  Record of every load cell calibration performed
                </v-list-item-subtitle>
                <v-list-item-action class="justify-end">
                  <v-btn color="primary" class="buttons" @click="getHistory">
                    <v-icon class="mr-1">mdi-refresh</v-icon>
                    Refresh
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
            </v-list>
            <v-divider class="mb-3"></v-divider>

            <v-table>
              <thead>
                <tr>
                  <th class="text-left">#</th>
                  <th class="text-left">Load Cell</th>
                  <th class="text-left">Date</th>
                  <th class="text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in history" :key="item.id">
                  <td>{{ index + 1 }}</td>
                  <td>
                    <v-chip
                      :color="item.load_cell === 'belly' ? 'deep-purple' : 'teal'"
                      size="small"
                      label
                    >
                      <v-icon start size="small">
                        {{ item.load_cell === 'belly' ? 'mdi-hook' : 'mdi-weight-gram' }}
                      </v-icon>
                      {{ item.load_cell_label || item.load_cell }}
                    </v-chip>
                  </td>
                  <td>{{ formatDate(item.calibrated_at) }}</td>
                  <td>{{ formatTime(item.calibrated_at) }}</td>
                </tr>
                <tr v-if="!history.length">
                  <td colspan="4" class="text-center text-medium-emphasis py-6">
                    No calibrations recorded yet
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import axios from "axios";
import config from "@/config";

export default {
  name: "CalibrationHistory",
  data: () => ({
    history: [],
  }),
  computed: {
    url_port: () => config.url_port(),
    url: () => config.url(),
  },
  methods: {
    getHistory() {
      const url = `${this.url}:${this.url_port}`;
      axios
        .get(`${url}/calibration-history`)
        .then((response) => {
          this.history = response.data?.data ?? [];
        })
        .catch((error) => console.log(error));
    },
    formatDate(iso) {
      if (!iso) return "";
      return new Date(iso).toLocaleDateString();
    },
    formatTime(iso) {
      if (!iso) return "";
      return new Date(iso).toLocaleTimeString();
    },
  },
  mounted() {
    this.getHistory();
  },
};
</script>
<style lang="scss" scoped></style>
