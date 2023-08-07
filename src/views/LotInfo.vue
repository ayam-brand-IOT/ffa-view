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
            <p class="mt-4">List of providers</p>
            <lot-list ref="lots" editable v-on:editLot="selectedLot"/>
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
  methods: {
    editedHandler() {
      console.log("editedHandler");
      this.$refs.lots.getLots();
    },
    selectedLot(item) {
      this.$refs.addLotModal.editItem(item);
    },
  },
  mounted() {
  },
};
</script>
<style lang="scss" scoped></style>
