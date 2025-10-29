<template>
  <v-dialog :persistent="should_persist" v-model="open_select" width="62%">
    <v-card>
      <div class="px-5 pt-4 text-h6">
        <v-icon>mdi-format-list-checks</v-icon>
        Select Lot
      </div>
      <div class="pa-5">
        <!-- lot list will emit the selected value -->
        <lot-list
          ref="lots"
          class="list-container"
          selectable
          @rowClicked="selectedItem"
        />

        <div class="d-flex customized-add">
          <small class="text-gray mt-2">*Select one lot to continue </small>
          <v-spacer></v-spacer>
          <add-lot @onFinish="editedHandler" />
        </div>
      </div>
      <v-card-actions class="mb-2 mx-2">
        <v-btn v-if="!should_persist" color="error" @click="close">
          <v-icon>mdi-close</v-icon>
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
import { watch } from "vue";
import addLot from "./addLot.vue";
import lotList from "./lotList.vue";

export default {
  name: "selectLot",
  components: {
    lotList,
    addLot,
  },
  data: () => ({
    open_select: false,
    selected_item: null,
    should_persist: false,
  }),
  props: ["modelValue"],
  emits: ["update:modelValue"],
  methods: {
    close() {
      this.should_persist = false;
      this.open_select = false;
    },
    editedHandler() {
      this.$refs.lots.getLots();
    },
    selectedItem(item) {
      this.selected_item = item;
      this.$emit("update:modelValue", this.selected_item);
      this.close();
      
    },
    emitSelected() {
      
    },
  },
  //   watch: {
  //     modelValue: function (val) {
  //       this.open_select = val;
  //     },
  //   },
};
</script>
<style lang="scss" scoped>
.list-container {
  border: 1px solid #ccc;
  border-radius: 5px;
  min-height: 250px;
}
</style>
<style lang="scss">
.customized-add {
  height: 35px;
  .v-btn {
    scale: 0.9 !important;
  }
}
</style>
