<template>
  <v-table class="mt-3" density="compact">
    <thead>
      <tr>
        <th
          style="text-transform: capitalize"
          v-for="columns in Object.keys(lotStructure)"
          class="text-left"
        >
          {{ columns }}
        </th>
        <th v-if="editable"></th>
      </tr>
    </thead>
    <tbody>
      <tr
        :class="[
          selectable ? 'selectable' : null,
          selectedIndex === index ? 'selected-item' : null,
        ]"
        @click="selectable ? rowClicked(item, index) : null"
        v-for="(item, index) in lotList"
        :key="item.lot_id"
      >
        <td v-for="row in Object.keys(lotStructure)">
          {{ item[row] }}
        </td>
        <td v-if="editable">
          <v-btn class="edit-button" icon color="blue" @click="editLot(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </td>
      </tr>
    </tbody>
    <request-modal ref="loadingModal" />
  </v-table>
</template>
<script>
import axios from "axios";
import config from "@/config";
import requestModal from "./requestModal.vue";

export default {
  name: "lotList",
  components: {
    requestModal,
  },
  computed: {
    url_port: () => config.url_port(),
    url: () => config.url(),
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
  },
  data: () => ({
    page: 1,
    lotList: [],
    selectedIndex: null,
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
  props: {
    editable: {
      type: Boolean,
      default: false,
    },
    selectable: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    rowClicked(item, index) {
      //   console.log(item);
      console.log(index);
      this.selectedIndex = index;
      this.$emit("rowClicked", item);
    },
    editLot(item) {
      this.$emit("editLot", item);
    },
    getLots() {
      // const url = 'http://127.0.0.1:${this.url_port}';
      this.$refs.loadingModal.open();
      const url = `${this.url}${this.url_port}`;
      axios
        .get(`${url}/lots/${this.page}`)
        .then((response) => {
          this.$refs.loadingModal.delayedClose(500);
          console.warn(response.data.data);
          this.lotList = response.data.data;
        })
        .catch((error) => {
            this.$refs.loadingModal.fail();
          console.log(error);
        });
    },
  },
  mounted() {
    this.getLots();
  },
};
</script>
<style lang="scss" scoped>
.selectable {
  cursor: pointer;
}
.selectable:hover {
  transition: all 0.3s ease-in-out;
  background-color: #e0e0e0;
}
.edit-button {
  width: 25px;
  height: 25px;
  i {
    font-size: 15px;
  }
}
.selected-item {
  background-color: #e0e0e0;
}
</style>
