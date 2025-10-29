<template>
  <div>
    <v-btn @click="add_lot_dialog = true" color="primary" class="buttons">
      <v-icon>mdi-plus</v-icon>
      Add
    </v-btn>

    <v-dialog v-model="add_lot_dialog" persistent width="70%" max-width="920">
      <v-card>
        <v-card-title class="mt-4">
          <span class="text-h5">
            <v-icon>mdi-plus</v-icon>
            Add Lot
          </span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <!-- validate-on="blur"
                @submit.prevent="addLot"
                v-model="form" -->
            <v-form ref="formLot">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    :rules="[required]"
                    v-model="lot.supplier"
                    variant="underlined"
                    label="Supplier name*"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    :disabled="editing"
                    :rules="[required]"
                    v-model="lot.lot_no"
                    prefix="#"
                    variant="underlined"
                    label="Lot #*"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    :rules="[required]"
                    v-model="lot.production_date"
                    variant="underlined"
                    label="Production date *"
                    type="date"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    :rules="[required]"
                    v-model="lot.fish_species"
                    variant="underlined"
                    :items="['SAR', 'MACK', 'H-MACK']"
                    label="Fish species *"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    :rules="[required]"
                    v-model="lot.type"
                    variant="underlined"
                    :items="['HGT', 'WR', 'HG']"
                    label="Type*"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    :rules="[required]"
                    v-model="lot.size"
                    variant="underlined"
                    :items="['TALL', 'S/O', 'B/O', 'TOW', 'CLUB', 'NA']"
                    label="Size*"
                  ></v-select>
                </v-col>
              </v-row>
              <small>*indicates required field</small>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  color="blue-darken-1"
                  variant="text"
                  @click="closeModal"
                >
                  Close
                </v-btn>
                <v-btn
                  :disabled="!formValid"
                  @click="addLot"
                  color="blue-darken-1"
                  variant="text"
                >
                  Save
                </v-btn>
              </v-card-actions>
            </v-form>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>
    <requestModal ref="loadingModal" />
  </div>
</template>
<script>
import axios from "axios";
import config from "@/config";
import requestModal from "./requestModal.vue";
// import DateField from '@/components/DateField.vue'

export default {
  name: "addLot",
  components: {
    requestModal,
    // DateField,
  },
  data: () => ({
    formValid: false,
    editing: false,
    add_lot_dialog: false,
    lot: {
      supplier: null,
      lot_no: null,
      production_date: null,
      fish_species: null,
      type: null,
      size: null,
      order_no: "a",
      wms_code: "a",
    },
  }),
  computed: {
    required(v) {
      return !!v || "Field is required";
    },
    url_port: () => config.url_port(),
    url: () => config.url(),
    lotStructure: () => ({
      supplier: null,
      lot_no: null,
      production_date: null,
      fish_species: null,
      type: null,
      size: null,
      order_no: "a",
      wms_code: "a",
    }),
  },
  methods: {
    async editItem(item) {
      //   this.$emit("editItem", item);
      this.editing = true;
      this.lot = { ...item };
      this.add_lot_dialog = true;
    },
    closeModal() {
      this.add_lot_dialog = false;
      this.editing = false;
    },
    async addLot() {
      const { editing } = this;
      this.lot.wms_code = Math.random().toString(36).substring(2, 15);
      this.lot.order_no = Math.random().toString(36).substring(2, 15);

      // const url = 'http://127.0.0.1:${this.url_port}';
      const url = `${this.url}:${this.url_port}`;
      const end_point = editing ? "/edit_lot" : "/add_lot";

      this.$refs.loadingModal.open();

      axios
        .post(`${url + end_point}`, this.lot, {
          headers: { Accept: "application/json" },
        })
        .then(
          (response) => {
            // console.log(response.data);
            if (editing) this.editing = false;
            this.$emit("onFinish", response.data);
            this.add_lot_dialog = false;
            this.$refs.loadingModal.success();
          },
          (error) => {
            console.log(error);
            this.$refs.loadingModal.fail();
          }
        );
    },
  },
  watch: {
    add_lot_dialog(val) {
      if (!val) {
        this.lot = { ...this.lotStructure };
      }
    },
    lot: {
      handler(val) {
        this.formValid = Object.values(val).every((x) => {
          return x;
        });
      },
      deep: true,
    },
  },
};
</script>
<style lang="scss" scoped>
.edit-button {
  width: 25px;
  height: 25px;
  i {
    font-size: 15px;
  }
}
</style>
