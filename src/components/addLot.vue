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
                  <v-menu v-model="datePickerMenu" :close-on-content-click="false">
                    <template #activator="{ props }">
                      <v-text-field
                        v-bind="props"
                        :rules="[required]"
                        :model-value="displayDate"
                        variant="underlined"
                        label="Production date *"
                        placeholder="DD/MM/YYYY"
                        readonly
                        prepend-inner-icon="mdi-calendar"
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="pickerDate"
                      @update:model-value="datePickerMenu = false"
                    ></v-date-picker>
                  </v-menu>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    :rules="[required]"
                    v-model="lot.order_no"
                    variant="underlined"
                    label="Order No*"
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
                    :items="['TALL', 'JITNEY', 'BUFFET']"
                    label="Size*"
                  ></v-select>
                </v-col>
                <v-col cols="12" md="6">
                  <v-autocomplete
                    :rules="[required]"
                    v-model="lot.item_code"
                    variant="underlined"
                    :items="itemCodes"
                    item-title="label"
                    item-value="code"
                    label="Item Code*"
                    placeholder="Search by code or description..."
                    clearable
                  ></v-autocomplete>
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

const ITEM_CODES = [
  // Mackerel
  { code: "10050071", label: "10050071 - Frozen Mackerel (HGT) Tail-On" },
  { code: "10050010", label: "10050010 - Frozen Mackerel Buffet" },
  { code: "10050011", label: "10050011 - Frozen Mackerel Buffet (B)" },
  { code: "10050013", label: "10050013 - Frozen Mackerel Buffet (B) XL" },
  { code: "10050012", label: "10050012 - Frozen Mackerel Buffet (T)" },
  { code: "10050080", label: "10050080 - Frozen Mackerel for Fried Fish" },
  { code: "10050060", label: "10050060 - Frozen Mackerel H&G (Tail-On)" },
  { code: "10050070", label: "10050070 - Frozen Mackerel HGT (Tail-Off)" },
  { code: "10050000", label: "10050000 - Frozen Mackerel Jitney" },
  { code: "10050001", label: "10050001 - Frozen Mackerel Jitney (B)" },
  { code: "10050003", label: "10050003 - Frozen Mackerel Jitney (B) XL" },
  { code: "10050002", label: "10050002 - Frozen Mackerel Jitney (T)" },
  { code: "10050020", label: "10050020 - Frozen Mackerel Tall" },
  { code: "10050021", label: "10050021 - Frozen Mackerel Tall (B)" },
  { code: "10050023", label: "10050023 - Frozen Mackerel Tall (B) XL" },
  { code: "10050022", label: "10050022 - Frozen Mackerel Tall (T)" },
  { code: "10050090", label: "10050090 - Frozen Mackerel Tower" },
  { code: "10050091", label: "10050091 - Frozen Mackerel Tower (B)" },
  { code: "10050093", label: "10050093 - Frozen Mackerel Tower (B) XL" },
  { code: "10050092", label: "10050092 - Frozen Mackerel Tower (T)" },
  // Sardines
  { code: "10000091", label: "10000091 - Frozen Sardine (HGT) Tail-On" },
  { code: "10000110", label: "10000110 - Frozen Sardine Tower" },
  { code: "10000080", label: "10000080 - Frozen Sardines (H&G) Tail-On" },
  { code: "10000090", label: "10000090 - Frozen Sardines (HGT) Tail-Off" },
  { code: "10003000", label: "10003000 - Frozen Sardines (Whole)" },
  { code: "10000010", label: "10000010 - Frozen Sardines Buffet" },
  { code: "10000000", label: "10000000 - Frozen Sardines Jitney" },
  { code: "10000001", label: "10000001 - Frozen Sardines Jitney (B)" },
  { code: "10000040", label: "10000040 - Frozen Sardines Oval Cut (Big)" },
  { code: "10000030", label: "10000030 - Frozen Sardines Oval Cut (Small)" },
  { code: "10000100", label: "10000100 - Frozen Sardines Quarter Club" },
  { code: "10000020", label: "10000020 - Frozen Sardines Tall" },
];

export default {
  name: "addLot",
  components: {
    requestModal,
  },
  data: () => ({
    formValid: false,
    editing: false,
    add_lot_dialog: false,
    datePickerMenu: false,
    lot: {
      supplier: null,
      lot_no: null,
      production_date: null,
      fish_species: null,
      type: null,
      size: null,
      order_no: null,
      item_code: null,
    },
  }),
  computed: {
    required(v) {
      return !!v || "Field is required";
    },
    url_port: () => config.url_port(),
    url: () => config.url(),
    itemCodes: () => ITEM_CODES,
    lotStructure: () => ({
      supplier: null,
      lot_no: null,
      production_date: null,
      fish_species: null,
      type: null,
      size: null,
      order_no: null,
      item_code: null,
    }),
    displayDate() {
      const d = this.lot.production_date;
      if (!d) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        const [y, m, day] = d.split("-");
        return `${day}/${m}/${y}`;
      }
      return d;
    },
    pickerDate: {
      get() {
        const d = this.lot.production_date;
        if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
        const [y, m, day] = d.split("-").map(Number);
        return new Date(y, m - 1, day);
      },
      set(val) {
        if (!val) return;
        const d = val instanceof Date ? val : new Date(val);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        this.lot.production_date = `${y}-${m}-${day}`;
      },
    },
  },
  methods: {
    async editItem(item) {
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

      const url = `${this.url}:${this.url_port}`;
      const end_point = editing ? "/edit_lot" : "/add_lot";

      this.$refs.loadingModal.open();

      axios
        .post(`${url + end_point}`, this.lot, {
          headers: { Accept: "application/json" },
        })
        .then(
          (response) => {
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
        this.formValid = Object.values(val).every((x) => !!x);
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
