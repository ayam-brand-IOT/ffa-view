<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="10">
        <v-card>
          <div class="d-flex flex-column px-5 pt-4">

            <div class="text-h6" >
              <v-icon>mdi-format-list-checks</v-icon>
              Select Lot
            </div>
            <small class="text-gray mt-2">*Select one lot to continue </small>
          </div>

          <div class="pa-5">
            <!-- Search Field -->
            <div class="d-flex align-center mb-4">
              <v-text-field
                v-model="searchQuery"
                label="Search lots..."
                placeholder="Search by WMS Code, Lot Number, or Supplier"
                prepend-inner-icon="mdi-magnify"
                clearable
                outlined
                dense
                class="flex-grow-1"
                hint="Search across WMS Code, Lot Number, and Supplier fields"
                persistent-hint
              ></v-text-field>

            </div>
            <!-- lot list will emit the selected value -->
            <lot-list
              ref="lots"
              class="list-container"
              selectable="false"
              :search-query="searchQuery"
              @rowClicked="selectedItem"
            />

           
          </div>

        </v-card>
      </v-col>
    </v-row>
    <request-modal ref="loadingModal" />
  </v-container>
</template>
<script>
import axios from "axios";
import config from "@/config";
import lotList from "@/components/lotList.vue";
import { mapState, mapGetters } from "vuex";

export default {
  name: "SelectLot",
  data: () => ({
    searchQuery: "",
    selected_item: null,
    lot: {
      supplier: "",
      lot_no: "",
      production_date: "",
      fish_species: "",
      type: "",
      size: "",
      order_no: "",
      wms_code: "",
    },
  }),
  components: {
    lotList,
  },
  computed: {
    ...mapState(["analyzing_lot", "socket_instance"]),
    ...mapGetters(["getAnalyzingLotNo"]),
    url_server: () => config.url_server(),
    url_port: () => config.url_port(),
    url: () => config.url(),
  },
  watch: {
    searchQuery(newVal) {
      console.log('SelectLot searchQuery changed to:', newVal);
    }
  },
  mounted() {
    // Ensure searchQuery is properly initialized
    this.searchQuery = "";
  },
  methods: {
    clearSearch() {
      this.searchQuery = "";
    },
    close() {
      this.should_persist = false;
      this.open_select = false;
    },
    editedHandler() {
      this.$refs.lots.getLots();
    },
    selectedItem(item) {
      this.$store.dispatch("setAnalyzingLot", item);

      const fish_species = item?.fish_species;
      const type = item?.type;

      console.warn("Vision values", fish_species, type);

        // post the fish species and type to the server
      this.socket_instance.emit("set_fish_data", { fish_species, type });
      
      this.$router.push({ name: "Analyse Lot" });
    },

  },
  mounted() {},
};
</script>
<style scoped lang="scss"></style>
