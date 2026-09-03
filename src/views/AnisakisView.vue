<template>
  <v-container fluid class="d-flex flex-column pa-0" style="height: 100%">
    <lot-stepper :current-step="3" />

    <div class="d-flex align-baseline mt-2 px-4">
      <h3 class="mb-3 ml-4">Lot #:</h3>
      <span class="ml-1">{{ getAnalyzingLotNo }}</span>
      <h4 class="mb-3 ml-4">Last sample #:</h4>
      <span class="ml-1">{{ last_analysed_id }}</span>
    </div>

    <div class="anisakis-body flex-grow-1 px-4">
      <v-row align="stretch">
        <!-- ── Tally ─────────────────────────────────────────────────────── -->
        <v-col cols="12" md="7">
          <v-card elevation="2" rounded="lg" class="fill-height d-flex flex-column">
            <v-card-title
              class="d-flex align-center ga-2 bg-primary pa-4 rounded-t-lg"
            >
              <v-icon>mdi-bacteria-outline</v-icon>
              Anisakis Inspection
            </v-card-title>

            <v-card-text class="pa-4">
              <!-- Sample size: drives every prevalence figure, so it leads. -->
              <div class="sample-size">
                <div class="sample-size__text">
                  <label class="field-label" for="fish-analyzed">
                    Fish analyzed
                  </label>
                  <p class="field-hint">
                    How many pieces this inspection covers. Usually 10.
                  </p>
                </div>
                <div class="counter">
                  <v-btn
                    icon="mdi-minus"
                    variant="tonal"
                    density="comfortable"
                    aria-label="One fewer fish analyzed"
                    :disabled="form.fish_analyzed <= 1"
                    @click="bump('fish_analyzed', -1)"
                  />
                  <v-text-field
                    id="fish-analyzed"
                    v-model.number="form.fish_analyzed"
                    class="counter__field"
                    type="number"
                    inputmode="numeric"
                    min="1"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    @blur="sanitize('fish_analyzed', 1)"
                  />
                  <v-btn
                    icon="mdi-plus"
                    variant="tonal"
                    density="comfortable"
                    aria-label="One more fish analyzed"
                    @click="bump('fish_analyzed', 1)"
                  />
                </div>
              </div>

              <v-divider class="my-4" />

              <!-- One block per site: the two counts that produce that site's
                   numbers sit together, so the relation is visible while
                   counting instead of only in the report. -->
              <fieldset
                v-for="site in sites"
                :key="site.key"
                class="site"
                :class="{ 'site--active': isTouched(site) }"
              >
                <legend class="site__legend">
                  <v-icon size="20" class="mr-2">{{ site.icon }}</v-icon>
                  <span class="site__name">{{ site.label }}</span>
                  <span class="site__hint">{{ site.hint }}</span>
                </legend>

                <div class="site__counts">
                  <div
                    v-for="row in [
                      { key: site.fishKey, label: 'Fish with anisakis', unit: 'fish' },
                      { key: site.foundKey, label: 'Anisakis found', unit: 'parasites' },
                    ]"
                    :key="row.key"
                    class="counter-group"
                  >
                    <label class="field-label" :for="row.key">
                      {{ row.label }}
                    </label>
                    <div class="counter">
                      <v-btn
                        icon="mdi-minus"
                        variant="tonal"
                        density="comfortable"
                        :aria-label="`One fewer: ${row.label} in ${site.label}`"
                        :disabled="form[row.key] <= 0"
                        @click="bump(row.key, -1)"
                      />
                      <v-text-field
                        :id="row.key"
                        v-model.number="form[row.key]"
                        class="counter__field"
                        type="number"
                        inputmode="numeric"
                        min="0"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        @blur="sanitize(row.key, 0)"
                      />
                      <v-btn
                        icon="mdi-plus"
                        variant="tonal"
                        density="comfortable"
                        :aria-label="`One more: ${row.label} in ${site.label}`"
                        @click="bump(row.key, 1)"
                      />
                    </div>
                  </div>
                </div>

                <p v-if="warningFor(site)" class="site__warning" role="status">
                  <v-icon size="16" class="mr-1">mdi-alert-outline</v-icon>
                  {{ warningFor(site) }}
                </p>
              </fieldset>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- ── Live results ──────────────────────────────────────────────── -->
        <v-col cols="12" md="5">
          <v-card elevation="2" rounded="lg" class="fill-height d-flex flex-column">
            <v-card-title class="d-flex align-center ga-2 pa-4">
              <v-icon>mdi-calculator-variant-outline</v-icon>
              Results
            </v-card-title>

            <v-card-text class="pa-4 pt-0 flex-grow-1">
              <p class="results__formula">
                <strong>Prevalence</strong> = infected fish ÷ fish analyzed &nbsp;·&nbsp;
                <strong>Intensity</strong> = parasites found ÷ infected fish
              </p>

              <div
                v-for="site in sites"
                :key="site.key"
                class="result"
                :class="{ 'result--empty': !isTouched(site) }"
              >
                <div class="result__head">
                  <v-icon size="18" class="mr-2">{{ site.icon }}</v-icon>
                  <span class="result__name">{{ site.label }}</span>
                  <span class="result__counts">
                    {{ form[site.fishKey] }} / {{ form.fish_analyzed }} fish ·
                    {{ form[site.foundKey] }} found
                  </span>
                </div>

                <div class="result__figures">
                  <div class="figure">
                    <span class="figure__label">Prevalence</span>
                    <span
                      class="figure__value"
                      :style="{ color: severityColor(metrics[site.key].prevalence) }"
                    >
                      {{ format(metrics[site.key].prevalence, 1, "%") }}
                    </span>
                    <div class="bar" role="presentation">
                      <span
                        class="bar__fill"
                        :style="{
                          transform: `scaleX(${barScale(metrics[site.key].prevalence)})`,
                          background: severityColor(metrics[site.key].prevalence),
                        }"
                      />
                    </div>
                  </div>

                  <div class="figure figure--plain">
                    <span class="figure__label">Intensity</span>
                    <span class="figure__value">
                      {{ format(metrics[site.key].intensity, 2) }}
                    </span>
                    <span class="figure__unit">per infected fish</span>
                  </div>
                </div>
              </div>

              <p v-if="isEmpty" class="results__empty">
                Nothing recorded yet. Prevalence and intensity update as you
                count, and a lot with no parasites is a valid result worth
                saving.
              </p>
            </v-card-text>

            <v-card-actions class="px-4 pb-4 d-flex flex-column align-stretch ga-2">
              <v-btn
                color="success"
                variant="flat"
                size="large"
                class="save-btn"
                :loading="saving"
                :disabled="!canSave"
                @click="saveData()"
              >
                <v-icon start>mdi-content-save-outline</v-icon>
                Save inspection
              </v-btn>
              <p class="save-state" :class="`save-state--${saveState}`" role="status">
                <v-icon v-if="saveState === 'saved'" size="16" class="mr-1">
                  mdi-check-circle-outline
                </v-icon>
                {{ saveMessage }}
              </p>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Step navigation -->
    <div class="d-flex justify-space-between mt-4 px-4 pb-4">
      <v-btn variant="text" color="grey" @click="$router.push('/broken-belly-test')">
        <v-icon start>mdi-arrow-left</v-icon>
        Back: BRT
      </v-btn>
      <v-btn color="primary" size="x-large" :loading="saving" @click="goToGutsWeight">
        {{ dirty ? "Save & Continue" : "Next: Guts Weight" }}
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
    </div>

    <notification ref="notification" />
  </v-container>
</template>

<script>
import axios from "axios";
import config from "@/config";
import { mapState, mapGetters } from "vuex";
import LotStepper from "@/components/LotStepper.vue";
import pushNotification from "@/components/pushNotification.vue";

// Where the parasite was found. Each site owns two counts: how many fish
// carried anisakis there, and how many anisakis were counted in total.
const SITES = [
  {
    key: "guts",
    label: "Guts",
    icon: "mdi-stomach",
    hint: "Viscera",
    fishKey: "fish_with_guts",
    foundKey: "presence_guts",
  },
  {
    key: "belly",
    label: "Belly",
    icon: "mdi-fish",
    hint: "Belly flaps and cavity wall",
    fishKey: "fish_with_belly",
    foundKey: "presence_belly",
  },
  {
    key: "embedded",
    label: "Embedded",
    icon: "mdi-bullseye",
    hint: "Inside the muscle",
    fishKey: "fish_with_embedded",
    foundKey: "presence_embedded",
  },
];

export default {
  name: "AnisakisView",
  components: {
    LotStepper,
    notification: pushNotification,
  },
  data: () => ({
    sites: SITES,
    form: {
      fish_analyzed: 10,
      fish_with_guts: 0,
      fish_with_belly: 0,
      fish_with_embedded: 0,
      presence_guts: 0,
      presence_belly: 0,
      presence_embedded: 0,
    },
    saving: false,
    // "clean" before anything is entered, "unsaved" while edits are pending,
    // "saved" once the server has the current numbers.
    saveState: "clean",
  }),
  computed: {
    ...mapState(["socket_instance", "last_analysed_id"]),
    ...mapGetters(["getAnalyzingLotNo"]),
    url_port: () => config.url_port(),
    url: () => config.url(),

    // Same formulas the server applies on save, mirrored here so the operator
    // sees the outcome while counting rather than after committing.
    metrics() {
      const analyzed = this.form.fish_analyzed;
      return SITES.reduce((acc, site) => {
        const infected = this.form[site.fishKey];
        const found = this.form[site.foundKey];
        acc[site.key] = {
          prevalence: analyzed > 0 ? (infected / analyzed) * 100 : null,
          intensity: infected > 0 ? found / infected : null,
        };
        return acc;
      }, {});
    },
    isEmpty() {
      return SITES.every((site) => !this.isTouched(site));
    },
    dirty() {
      return this.saveState === "unsaved";
    },
    canSave() {
      return this.form.fish_analyzed > 0 && this.saveState !== "saved";
    },
    saveMessage() {
      if (this.saveState === "saved") return "Saved for this lot";
      if (this.saveState === "unsaved") return "Not saved yet";
      return "A result of zero still needs saving";
    },
  },
  watch: {
    form: {
      deep: true,
      handler() {
        this.saveState = "unsaved";
      },
    },
  },
  methods: {
    notify(message, type = "success", time) {
      this.$refs.notification.push(message, type, time);
    },
    isTouched(site) {
      return this.form[site.fishKey] > 0 || this.form[site.foundKey] > 0;
    },
    bump(key, delta) {
      const floor = key === "fish_analyzed" ? 1 : 0;
      this.form[key] = Math.max(floor, (Number(this.form[key]) || 0) + delta);
    },
    // Typed input can leave the field empty or negative; clamp on blur rather
    // than fighting the operator mid-keystroke.
    sanitize(key, floor) {
      const value = Math.trunc(Number(this.form[key]));
      this.form[key] = Number.isFinite(value) ? Math.max(floor, value) : floor;
    },
    format(value, decimals, suffix = "") {
      if (value == null) return "—";
      return `${value.toFixed(decimals)}${suffix}`;
    },
    // Thresholds match the report so a bar read here means the same thing on
    // the printed PDF.
    severityColor(prevalence) {
      if (prevalence == null || prevalence === 0) return "rgba(0, 0, 0, 0.60)";
      if (prevalence > 30) return "#B3261E";
      if (prevalence > 10) return "#8A5300";
      return "#1B5E20";
    },
    barScale(prevalence) {
      if (!prevalence) return 0;
      return Math.min(prevalence, 100) / 100;
    },
    // Counting more infected fish than were inspected, or fewer parasites than
    // infected fish, means a miscount. Warn without blocking: the operator is
    // often mid-tally and the server accepts whatever is finally saved.
    warningFor(site) {
      const infected = this.form[site.fishKey];
      const found = this.form[site.foundKey];
      if (infected > this.form.fish_analyzed) {
        return `More fish with anisakis (${infected}) than fish analyzed (${this.form.fish_analyzed}).`;
      }
      if (infected > 0 && found < infected) {
        return `Only ${found} anisakis for ${infected} infected fish — each infected fish has at least one.`;
      }
      if (infected === 0 && found > 0) {
        return `${found} anisakis recorded but no infected fish counted.`;
      }
      return "";
    },
    saveData(options = {}) {
      this.saving = true;

      const url = `${this.url}:${this.url_port}/add-anisakis`;
      const data = { ...this.form, lot_no: this.getAnalyzingLotNo };

      return axios
        .post(url, data, { headers: { Accept: "application/json" } })
        .then(
          () => {
            this.saveState = "saved";
            this.notify("Anisakis inspection saved", "success", 1200);
            if (options.navigateTo) {
              setTimeout(() => this.$router.push(options.navigateTo), 600);
            }
          },
          (error) => {
            console.log(error);
            this.notify("Error saving anisakis inspection", "error", 3000);
          }
        )
        .then(() => {
          this.saving = false;
        });
    },
    goToGutsWeight() {
      if (this.dirty) {
        this.saveData({ navigateTo: "/guts-weight" });
      } else {
        this.$router.push("/guts-weight");
      }
    },
  },
};
</script>

<style lang="scss" scoped>
// Interruptible, exponential ease-out: entering values settle fast without
// the sluggish start of ease-in.
$ease-out: cubic-bezier(0.23, 1, 0.32, 1);

.anisakis-body {
  overflow-y: auto;
}

.field-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: rgba(0, 0, 0, 0.78);
  margin-bottom: 4px;
}

.field-hint {
  margin: 0;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.66);
}

.sample-size {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  &__text {
    min-width: 200px;
    flex: 1 1 220px;
  }
}

.counter {
  display: flex;
  align-items: center;
  gap: 8px;

  &__field {
    width: 96px;
    flex: 0 0 96px;

    :deep(input) {
      text-align: center;
      font-variant-numeric: tabular-nums;
      font-size: 1.125rem;
      font-weight: 600;
    }

    // The spinners are redundant next to the ± buttons and shrink the tap area.
    :deep(input[type="number"]) {
      -moz-appearance: textfield;
    }
    :deep(input::-webkit-outer-spin-button),
    :deep(input::-webkit-inner-spin-button) {
      -webkit-appearance: none;
      margin: 0;
    }
  }

  .v-btn {
    transition: transform 160ms $ease-out;

    &:active {
      transform: scale(0.94);
    }
  }
}

.site {
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 8px;
  padding: 8px 16px 16px;
  margin-bottom: 12px;
  background: #fff;
  transition: border-color 200ms $ease-out, background-color 200ms $ease-out;

  &--active {
    border-color: rgba(0, 0, 0, 0.28);
    background: #fafbfe;
  }

  &__legend {
    display: flex;
    align-items: baseline;
    padding: 0 6px;
  }

  &__name {
    font-size: 0.9375rem;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.87);
  }

  &__hint {
    margin-left: 8px;
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.66);
  }

  &__counts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px 24px;
    margin-top: 4px;
  }

  &__warning {
    display: flex;
    align-items: center;
    margin: 10px 0 0;
    font-size: 0.8125rem;
    color: #8a5300;
  }
}

.counter-group {
  display: flex;
  flex-direction: column;
}

.results {
  &__formula {
    margin: 0 0 16px;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: rgba(0, 0, 0, 0.66);
  }

  &__empty {
    margin: 16px 0 0;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: rgba(0, 0, 0, 0.66);
  }
}

.result {
  padding: 12px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  transition: opacity 200ms $ease-out;

  &--empty {
    opacity: 0.72;
  }

  &__head {
    display: flex;
    align-items: center;
  }

  &__name {
    font-size: 0.9375rem;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.87);
  }

  &__counts {
    margin-left: auto;
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    color: rgba(0, 0, 0, 0.66);
  }

  &__figures {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 20px;
    margin-top: 8px;
  }
}

.figure {
  display: flex;
  flex-direction: column;

  &__label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.66);
  }

  &__value {
    font-size: 1.375rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
    color: rgba(0, 0, 0, 0.87);
  }

  &__unit {
    font-size: 0.6875rem;
    color: rgba(0, 0, 0, 0.66);
  }
}

.bar {
  height: 4px;
  margin-top: 6px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.1);
  overflow: hidden;

  &__fill {
    display: block;
    height: 100%;
    width: 100%;
    transform-origin: left center;
    transform: scaleX(0);
    transition: transform 220ms $ease-out, background-color 220ms $ease-out;
  }
}

.save-btn {
  transition: transform 160ms $ease-out;

  &:active {
    transform: scale(0.97);
  }
}

.save-state {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.66);

  &--saved {
    color: #1b5e20;
  }

  &--unsaved {
    color: #8a5300;
  }
}

@media (prefers-reduced-motion: reduce) {
  .counter .v-btn,
  .save-btn,
  .site,
  .result,
  .bar__fill {
    transition-duration: 0ms;
  }

  .counter .v-btn:active,
  .save-btn:active {
    transform: none;
  }
}
</style>
