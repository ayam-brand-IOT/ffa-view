<template>
  <v-stepper
    :model-value="currentStep"
    flat
    class="lot-stepper"
    alt-labels
  >
    <v-stepper-header>
      <v-stepper-item
        :value="1"
        title="Samples"
        subtitle="Sample capture"
        :complete="currentStep > 1"
        color="primary"
      />
      <v-divider />
      <v-stepper-item
        :value="2"
        title="BRT"
        subtitle="Broken Belly Test"
        :complete="currentStep > 2"
        color="primary"
      />
      <v-divider />
      <v-stepper-item
        :value="3"
        title="Guts Weight"
        subtitle="Viscera weight"
        :complete="currentStep > 3"
        color="primary"
      />
    </v-stepper-header>
  </v-stepper>
</template>

<script>
export default {
  name: "LotStepper",
  props: {
    currentStep: {
      type: Number,
      default: 1,
    },
  },
};
</script>

<style scoped>
.lot-stepper {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
