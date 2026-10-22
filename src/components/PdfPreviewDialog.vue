<template>
  <v-dialog v-model="show" fullscreen transition="dialog-bottom-transition">
    <v-card class="d-flex flex-column" style="height: 100%">
      <v-toolbar color="error" density="comfortable">
        <v-icon class="ml-4">mdi-file-pdf-box</v-icon>
        <v-toolbar-title>{{ title }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <span v-if="pageCount" class="mr-4 text-body-2">{{ pageCount }} pages</span>
        <v-btn variant="text" :disabled="!blob" @click="$emit('download')">
          <v-icon start>mdi-download</v-icon>Download
        </v-btn>
        <v-btn variant="text" @click="show = false">
          <v-icon start>mdi-close</v-icon>Close
          <v-chip size="x-small" class="ml-2">Esc</v-chip>
        </v-btn>
      </v-toolbar>

      <div ref="scroller" class="pages flex-grow-1">
        <div v-if="loading || rendering" class="state">
          <v-progress-circular indeterminate color="error" size="64" />
        </div>
        <div v-else-if="error || renderError" class="state text-grey">
          <v-icon size="48" color="error" class="mb-2">mdi-alert-circle</v-icon>
          <p>{{ error || renderError }}</p>
        </div>
        <div ref="pages"></div>
      </div>
    </v-card>
  </v-dialog>
</template>
<script>
// pdf.js is vendored in public/static/vendor so the station renders offline
// and the same way in any browser (the kiosk's built-in viewer is not relied on).
const PDFJS_DIR = "/static/vendor/pdfjs-3.11.174";
const MAX_PAGE_WIDTH = 1100;
let pdfjsReady = null;

function loadPdfjs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (!pdfjsReady) {
    pdfjsReady = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${PDFJS_DIR}/pdf.min.js`;
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_DIR}/pdf.worker.min.js`;
        resolve(window.pdfjsLib);
      };
      script.onerror = () => {
        pdfjsReady = null;
        reject(new Error("Could not load the PDF viewer"));
      };
      document.head.appendChild(script);
    });
  }
  return pdfjsReady;
}

export default {
  name: "PdfPreviewDialog",
  props: {
    modelValue: { type: Boolean, default: false },
    blob: { type: Blob, default: null },
    title: { type: String, default: "FFA Report" },
    loading: { type: Boolean, default: false },
    error: { type: String, default: null },
  },
  emits: ["update:modelValue", "download"],
  data: () => ({
    rendering: false,
    renderError: null,
    pageCount: 0,
    renderedBlob: null,
  }),
  computed: {
    show: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit("update:modelValue", value);
      },
    },
  },
  watch: {
    modelValue() {
      this.renderWhenReady();
    },
    blob() {
      this.renderWhenReady();
    },
  },
  methods: {
    renderWhenReady() {
      if (!this.modelValue || !this.blob || this.blob === this.renderedBlob) return;
      // The dialog content mounts on open; wait for the page container.
      this.$nextTick(() => this.render(this.blob));
    },
    async render(blob) {
      const container = this.$refs.pages;
      if (!container) return;
      this.rendering = true;
      this.renderError = null;
      container.replaceChildren();
      try {
        const pdfjsLib = await loadPdfjs();
        const pdf = await pdfjsLib.getDocument({ data: await blob.arrayBuffer() }).promise;
        this.pageCount = pdf.numPages;
        const width = Math.min(MAX_PAGE_WIDTH, this.$refs.scroller.clientWidth - 32);
        const ratio = window.devicePixelRatio || 1;
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const scale = width / page.getViewport({ scale: 1 }).width;
          const viewport = page.getViewport({ scale: scale * ratio });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = `${viewport.width / ratio}px`;
          canvas.className = "pdf-page";
          container.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
          if (n === 1) this.rendering = false; // show the first page while the rest render
        }
        this.renderedBlob = blob;
      } catch (error) {
        console.error(error);
        this.renderError = "Could not display the report. Use Download instead.";
      } finally {
        this.rendering = false;
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.pages {
  min-height: 0;
  overflow-y: auto;
  background: #525659;
  padding: 16px;
}
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #fff;
}
.pages :deep(.pdf-page) {
  display: block;
  margin: 0 auto 16px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
</style>
