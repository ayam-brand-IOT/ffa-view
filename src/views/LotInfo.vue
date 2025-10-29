<template>
  <v-container style="height: 100%">
    <v-row style="height: 100%" justify="center">
      <v-col cols="10">
        <div class="d-flex mb-5">
          <!-- back button -->
          <router-link to="/config" size="x-large" variant="plain">
            <v-icon>mdi-arrow-left</v-icon> Back
          </router-link>
          <!-- <h1>History</h1> -->
        </div>
        <v-card elevation="2">
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title>Add new Lot #</v-list-item-title>

                <v-list-item-subtitle>
                  Here you can add a new Lot to be processed
                </v-list-item-subtitle>
                <v-list-item-action class="justify-end">
                  <add-lot ref="addLotModal" @onFinish="editedHandler"/>
                </v-list-item-action>
              </v-list-item>
            </v-list>
            <v-divider></v-divider>
            <p class="mt-4">List of lots - Click the log icon to view lot details</p>
            
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
            
            <lot-list ref="lots" editable :search-query="searchQuery" v-on:editLot="selectedLot"/>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import axios from "axios";
import config from "@/config";
import { mapState } from "vuex";
import { mapGetters } from "vuex";
import addLot from "@/components/addLot.vue";
import lotList from "@/components/lotList.vue";

export default {
  name: "LotInfo",
  components: {
    addLot,
    lotList
  },
  data() {
    return {
      searchQuery: "",
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
    };
  },
  computed: {
    url_port() {
      return config.url_port();
    },
    lotStructure() {
      return {
        supplier: "",
        lot_no: "",
        production_date: "",
        fish_species: "",
        type: "",
        size: "",
        order_no: "",
        wms_code: "",
      };
    },
    ...mapState({
      // config: state => state.config
    }),
    ...mapGetters({
      // config: 'config'
    }),
  },
  watch: {
    searchQuery(newVal) {
      console.log('LotInfo searchQuery changed to:', newVal);
    }
  },
  methods: {
    clearSearch() {
      this.searchQuery = "";
    },
    editedHandler() {
      console.log("editedHandler");
      this.$refs.lots.getLots();
    },
    selectedLot(item) {
      // Set the selected lot in the store
      this.$store.dispatch("setAnalyzingLot", item);
      
      // Navigate to log with a query parameter indicating the source
      this.$router.push({ 
        name: "Log", 
        query: { from: 'lot-info' } 
      });
    },
  },
  mounted() {
    // Ensure searchQuery is properly initialized
    this.searchQuery = "";
  },
};
</script>
<style lang="scss" scoped></style>
