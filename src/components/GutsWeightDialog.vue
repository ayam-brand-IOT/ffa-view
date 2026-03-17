<template>
  <v-dialog
    :model-value="modelValue"
    transition="dialog-bottom-transition"
    max-width="480"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center ga-2 bg-primary pa-4">
        <v-icon>mdi-scale</v-icon>
        Guts Weight Captured
      </v-card-title>

      <v-card-text class="pa-6">
        <div class="text-center mb-5">
          <div class="text-body-2 text-grey mb-1">Current reading</div>
          <div class="text-h3 font-weight-bold text-primary">
            {{ localWeight }}
            <span class="text-h5 font-weight-regular text-grey">g</span>
          </div>
        </div>

        <v-divider class="mb-5" />

        <v-text-field
          v-model.number="localWeight"
          label="Adjust weight if needed"
          type="number"
          suffix="g"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-pencil-outline"
          hide-details
        />
      </v-card-text>

      <v-card-actions class="justify-end px-4 pb-4 ga-2">
        <v-btn color="grey" variant="text" @click="onCancel">
          <v-icon start>mdi-close</v-icon>
          Cancel
        </v-btn>
        <v-btn color="success" variant="elevated" @click="onConfirm">
          <v-icon start>mdi-check</v-icon>
          Confirm
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "GutsWeightDialog",

  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    weight: {
      type: Number,
      default: 0,
    },
  },

  emits: ["update:modelValue", "confirm", "cancel"],

  data: () => ({
    localWeight: 0,
  }),

  watch: {
    modelValue(opened) {
      if (opened) this.localWeight = this.weight;
    },
  },

  methods: {
    onConfirm() {
      this.$emit("confirm", this.localWeight);
      this.$emit("update:modelValue", false);
    },
    onCancel() {
      this.$emit("cancel");
      this.$emit("update:modelValue", false);
    },
  },
};
</script>
