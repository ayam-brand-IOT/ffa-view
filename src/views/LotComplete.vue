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
          prepend-icon="mdi-file-eye"
          title="Preview FFA Report"
          subtitle="Open the quality control report here"
          color="error"
          @click="previewPdf"
          rounded="lg"
          active-color="error"
          class="mb-1"
        >
          <template #append>
            <v-icon color="error">mdi-eye</v-icon>
          </template>
        </v-list-item>

        <v-divider />

        <v-list-item
          prepend-icon="mdi-file-pdf-box"
          title="Download FFA Report"
          subtitle="Full quality control report as .pdf"
          color="error"
          @click="downloadPdf"
          :loading="downloadingPdf"
          rounded="lg"
          active-color="error"
          class="mb-1"
        >
          <template #append>
            <v-icon color="error">mdi-download</v-icon>
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

    <pdf-preview-dialog
      v-model="previewOpen"
      :blob="pdfBlob"
      :loading="downloadingPdf"
      :error="pdfError"
      :title="`FFA Report · Lot #${lotNo}`"
      @download="downloadPdf"
    />
  </v-container>
</template>

<script>
import config from "@/config";
import { mapGetters } from "vuex";
import PdfPreviewDialog from "@/components/PdfPreviewDialog.vue";

export default {
  name: "LotComplete",
  components: { PdfPreviewDialog },
  data: () => ({
    downloading: false,
    downloadingPdf: false,
    previewOpen: false,
    // The report is built once and reused by the preview and the download.
    pdfBlob: null,
    pdfUrl: null,
    pdfError: null,
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
    async loadPdf() {
      if (this.pdfBlob) return this.pdfBlob;
      this.downloadingPdf = true;
      this.pdfError = null;
      try {
        const response = await fetch(
          `${this.url}:${this.url_port}/download-lot-report/${this.lotNo}`
        );
        if (!response.ok) throw new Error("Download failed");
        this.pdfBlob = new Blob([await response.blob()], { type: "application/pdf" });
        this.pdfUrl = URL.createObjectURL(this.pdfBlob);
        return this.pdfBlob;
      } catch (error) {
        console.error(error);
        this.pdfError = "Could not generate the report. Try again.";
        return null;
      } finally {
        this.downloadingPdf = false;
      }
    },
    previewPdf() {
      this.previewOpen = true;
      this.loadPdf();
    },
    async downloadPdf() {
      if (!(await this.loadPdf())) return;
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const link = document.createElement("a");
      link.href = this.pdfUrl;
      link.download = `${date}_${this.lotNo}.pdf`;
      link.click();
    },
    goToLogs() {
      this.$router.push("/log");
    },
    goHome() {
      this.$store.dispatch("setAnalyzingLot", null);
      this.$router.push("/");
    },
  },
  beforeUnmount() {
    if (this.pdfUrl) URL.revokeObjectURL(this.pdfUrl);
  },
};
</script>
