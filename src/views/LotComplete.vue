<template>
  <v-container fluid class="d-flex flex-column align-center justify-center" style="height: 100%">
    <v-icon size="80" color="success" class="mb-4">mdi-check-circle</v-icon>
    <h1 class="mb-2">Lot Analysis Complete</h1>
    <p class="text-grey text-body-1 mb-8">
      Lot <strong>#{{ lotNo }}</strong> has been fully processed.
    </p>

    <v-card elevation="2" rounded="lg" min-width="360" class="mb-6">
      <v-list>
        <v-list-subheader>What would you like to do next?</v-list-subheader>

        <v-list-item
          prepend-icon="mdi-microsoft-excel"
          title="Download Excel"
          subtitle="Export all samples data as .xlsx"
          color="success"
          @click="downloadExcel"
          :loading="downloading"
          rounded="lg"
          active-color="success"
          class="mb-1"
        >
          <template #append>
            <v-icon color="success">mdi-download</v-icon>
          </template>
        </v-list-item>

        <v-divider />

        <v-list-item
          prepend-icon="mdi-format-list-bulleted-square"
          title="View Logs"
          subtitle="Inspect the analysis event log"
          rounded="lg"
          class="mb-1"
          @click="goToLogs"
        >
          <template #append>
            <v-icon>mdi-arrow-right</v-icon>
          </template>
        </v-list-item>

        <v-divider />

        <v-list-item
          prepend-icon="mdi-home"
          title="Back to Home"
          subtitle="Return to lot selection"
          rounded="lg"
          @click="goHome"
        >
          <template #append>
            <v-icon>mdi-arrow-right</v-icon>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script>
import config from "@/config";
import { mapGetters } from "vuex";

export default {
  name: "LotComplete",
  data: () => ({
    downloading: false,
  }),
  computed: {
    ...mapGetters(["getAnalyzingLotNo"]),
    lotNo() {
      return this.getAnalyzingLotNo;
    },
    url_port: () => config.url_port(),
    url: () => config.url(),
  },
  methods: {
    async downloadExcel() {
      this.downloading = true;
      try {
        const response = await fetch(
          `${this.url}:${this.url_port}/download-lot-samples/${this.lotNo}`
        );
        if (!response.ok) throw new Error("Download failed");
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `lot_${this.lotNo}.xlsx`;
        link.click();
        URL.revokeObjectURL(link.href);
      } catch (error) {
        console.error(error);
      } finally {
        this.downloading = false;
      }
    },
    goToLogs() {
      this.$router.push("/log");
    },
    goHome() {
      this.$store.dispatch("setAnalyzingLot", null);
      this.$router.push("/");
    },
  },
};
</script>
