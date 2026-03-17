<template>
  <v-dialog
    persistent
    :model-value="modelValue"
    transition="dialog-bottom-transition"
    width="auto"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card min-width="360">
      <v-card-title class="text-h6 pt-4 px-5">
        <v-icon color="warning" class="mr-2">mdi-alert-circle-outline</v-icon>
        Alert
      </v-card-title>

      <v-card-text class="px-5 pb-2">
        <div class="text-body-2">
          You're leaving without <b>saving</b>.<br />
          Would you like to save the last test?
        </div>
        <div class="text-caption text-grey mt-3">
          Press <kbd>Y</kbd> to save &nbsp;·&nbsp; <kbd>N</kbd> to discard
        </div>
      </v-card-text>

      <v-card-actions class="justify-end px-4 pb-4">
        <v-btn color="red" variant="text" @click="$emit('cancel')">
          <v-icon start>mdi-close</v-icon>
          No
        </v-btn>
        <v-btn color="success" variant="elevated" @click="$emit('confirm')">
          <v-icon start>mdi-content-save-outline</v-icon>
          Yes
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "SaveDialog",

  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },

  emits: ["update:modelValue", "confirm", "cancel"],
};
</script>
