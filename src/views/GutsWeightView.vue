<template>
  <v-container fluid class="d-flex flex-column" style="height: 100%">
    <lot-stepper :current-step="3" />

    <div class="d-flex align-baseline mt-2">
      <h3 class="mb-3 ml-4">Lot #:</h3>
      <span class="ml-1">{{ getAnalyzingLotNo }}</span>
      <h4 class="mb-3 ml-4">Last sample #:</h4>
      <span class="ml-1">{{ last_analysed_id }}</span>
    </div>

    <v-row justify="center" align="center" style="flex: 1">
      <v-col cols="12" md="6">
        <v-card elevation="2" rounded="lg" class="pa-6">
          <v-card-title class="d-flex align-center ga-2 bg-primary pa-4 rounded-t-lg mb-4">
            <v-icon>mdi-scale</v-icon>
            Guts Weight
          </v-card-title>

          <v-card-text>
            <div class="text-center mb-6">
              <div class="text-body-2 text-grey mb-1">Live weight</div>
              <div
                class="text-h2 font-weight-bold"
                :class="weightIsStable ? 'text-green' : 'text-red'"
              >
                {{ liveWeight }}
                <span class="text-h4 font-weight-regular text-grey">g</span>
              </div>
              <v-chip
                :color="weightIsStable ? 'green' : 'red'"
                variant="tonal"
                class="mt-2"
              >
                {{ weightIsStable ? "Stable" : "Unstable" }}
              </v-chip>
            </div>

            <v-divider class="mb-5" />

            <div class="text-body-1 mb-2">Captured weight</div>
            <v-text-field
              v-model.number="capturedWeight"
              label="Guts weight"
              type="number"
              suffix="g"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-pencil-outline"
              hide-details
              class="mb-4"
            />

            <v-btn
              block
              color="primary"
              variant="tonal"
              @click="captureFromLive"
              class="mb-2"
            >
              <v-icon start>mdi-arrow-down-bold</v-icon>
              Capture current weight ({{ liveWeight }} g)
            </v-btn>

            <v-btn
              block
              color="success"
              size="large"
              :disabled="capturedWeight === 0"
              @click="saveGutsWeight"
              :loading="saving"
            >
              <v-icon start>mdi-check</v-icon>
              Save Guts Weight
            </v-btn>

            <div v-if="saved" class="text-center mt-4">
              <v-icon color="green" size="24">mdi-check-circle</v-icon>
              <span class="text-green ml-2">Saved: {{ savedWeight }} g</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <div class="d-flex justify-space-between mt-4 px-4 pb-4">
      <v-btn variant="text" color="grey" @click="$router.push('/broken-belly-test')">
        <v-icon start>mdi-arrow-left</v-icon>
        Back: BRT
      </v-btn>
      <v-btn color="success" size="x-large" @click="finishLot">
        <v-icon start>mdi-check-all</v-icon>
        Finish Lot
      </v-btn>
    </div>

    <notification ref="notification" />

    <v-dialog v-model="confirmDialog" max-width="420" persistent>
      <v-card>
        <v-card-title class="d-flex align-center ga-2 pt-4 px-4">
          <v-icon color="warning">mdi-alert-circle-outline</v-icon>
          Unsaved guts weight
        </v-card-title>
        <v-card-text class="px-4">
          You have a captured weight of <strong>{{ capturedWeight }} g</strong> that hasn't been saved.
          Do you want to save it before finishing?
        </v-card-text>
        <v-card-actions class="pb-4 px-4">
          <v-btn variant="text" color="grey" @click="confirmDialog = false">
            Cancel
          </v-btn>
          <v-spacer />
          <v-btn variant="text" color="error" @click="skipAndFinish">
            Skip & Finish
          </v-btn>
          <v-btn
            color="success"
            variant="flat"
            :loading="saving"
            @click="saveAndFinish"
          >
            <v-icon start>mdi-check</v-icon>
            Save & Finish
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import axios from "axios";
import config from "@/config";
import { mapState, mapGetters } from "vuex";
import LotStepper from "@/components/LotStepper.vue";
import pushNotification from "@/components/pushNotification.vue";

export default {
  name: "GutsWeightView",
  components: {
    LotStepper,
    notification: pushNotification,
  },
  data: () => ({
    liveWeight: 0,
    capturedWeight: 0,
    weightIsStable: false,
    saving: false,
    saved: false,
    savedWeight: 0,
    confirmDialog: false,
  }),
  computed: {
    ...mapState(["socket_instance", "last_analysed_id"]),
    ...mapGetters(["getAnalyzingLotNo"]),
    url_port: () => config.url_port(),
    url: () => config.url(),
  },
  methods: {
    notify(message, type = "success") {
      this.$refs.notification.push(message, type);
    },
    captureFromLive() {
      this.capturedWeight = this.liveWeight;
      this.notify("Weight captured from scale", "info");
    },
    async saveGutsWeight() {
      this.saving = true;
      try {
        await axios.post(
          `${this.url}:${this.url_port}/add-guts-weight`,
          {
            weight: this.capturedWeight,
            lot_no: this.getAnalyzingLotNo,
            muestra_id: this.last_analysed_id,
          },
          { headers: { Accept: "application/json" } }
        );
        this.savedWeight = this.capturedWeight;
        this.saved = true;
        this.notify(`Guts weight saved: ${this.capturedWeight} g`, "success");
      } catch (error) {
        console.error(error);
        this.notify("Error saving guts weight", "error");
      } finally {
        this.saving = false;
      }
    },
    finishLot() {
      if (!this.saved && this.capturedWeight > 0) {
        this.confirmDialog = true;
      } else {
        this.$router.push("/lot-complete");
      }
    },
    skipAndFinish() {
      this.confirmDialog = false;
      this.$router.push("/lot-complete");
    },
    async saveAndFinish() {
      await this.saveGutsWeight();
      this.confirmDialog = false;
      this.$router.push("/lot-complete");
    },
  },
  mounted() {
    const { socket_instance } = this;

    socket_instance.emit("enter_to_weight_mode", {});

    socket_instance.on("weight_update", (data) => {
      const prev = this.liveWeight;
      this.liveWeight = data;
      const diff = prev > 0
        ? (Math.abs(data - prev) / prev) * 100
        : 100;
      this.weightIsStable = diff < 5 && data > 0;
    });

    // El backend sólo manda weight_update cuando se le pide con update_net,
    // mismo patrón que HomeView. Sin esto el peso queda en 0.
    this.weightInterval = setInterval(() => {
      socket_instance.emit("update_net", {});
    }, 250);
  },
  beforeUnmount() {
    this.socket_instance.off("weight_update");
    if (this.weightInterval) clearInterval(this.weightInterval);
  },
};
</script>
