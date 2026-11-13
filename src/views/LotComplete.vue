<template>
  <v-container fluid class="d-flex flex-column align-center justify-center" style="height: 100%">
    <v-icon size="80" color="success" class="mb-4">mdi-check-circle</v-icon>
    <h1 class="mb-2">Lot Analysis Complete</h1>
    <p class="text-grey text-body-1 mb-4">
      Lot <strong>#{{ lotNo }}</strong> has been fully processed.
    </p>

    <!-- The report and the Excel are kept on the server for later -->
    <div class="d-flex align-center mb-8 text-body-2" style="min-height: 36px">
      <template v-if="saving">
        <v-progress-circular indeterminate size="18" width="2" class="mr-2" />
        Saving report and Excel on the server…
      </template>
      <template v-else-if="savedExport">
        <v-icon color="success" class="mr-2">mdi-cloud-check</v-icon>
        Report and Excel saved on the server (#{{ savedExport.id }} · {{ savedExport.stamp }})
      </template>
      <template v-else-if="saveError">
        <v-icon color="error" class="mr-2">mdi-cloud-alert</v-icon>
        {{ saveError }}
        <v-btn variant="text" color="primary" size="small" class="ml-2" @click="saveOnServer">
          Retry
        </v-btn>
      </template>
    </div>

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
    saving: false,
    savedExport: null,
    saveError: null,
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
    async saveOnServer() {
      if (!this.lotNo) return;
      this.saving = true;
      this.saveError = null;
      try {
        const response = await fetch(
          `${this.url}:${this.url_port}/ffa-station/exports/${encodeURIComponent(this.lotNo)}`,
          { method: "POST" }
        );
        if (!response.ok) throw new Error(`Save failed (${response.status})`);
        this.savedExport = await response.json();
      } catch (error) {
        console.error(error);
        this.saveError = "Could not save the report on the server.";
      } finally {
        this.saving = false;
      }
    },
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
  mounted() {
    this.saveOnServer();
  },
  beforeUnmount() {
    if (this.pdfUrl) URL.revokeObjectURL(this.pdfUrl);
  },
};
</script>
