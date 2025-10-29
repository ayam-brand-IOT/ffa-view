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
        v-for="(item, index) in filteredLotList"
        :key="item.lot_id"
      >
        <td v-for="row in Object.keys(lotStructure)">
          {{ item[row] }}
        </td>
        <td >
          <v-btn v-if="editable" class="edit-button" icon color="blue" @click="editLot(item)" title="View Log">
            <v-icon>mdi-format-list-bulleted-square</v-icon>
          </v-btn>
          <v-btn
            v-if="selectable"
            class="edit-button"
            icon
            color="green"
            @click="analyseLot(item)"
          >
            <v-icon>mdi-chevron-right</v-icon>
          </v-btn>
        </td>
      </tr>
      <!-- No results message -->
      <tr v-if="filteredLotList.length === 0 && lotList.length > 0">
        <td :colspan="Object.keys(lotStructure).length + 1" class="text-center pa-4">
          <v-icon color="grey" class="mr-2">mdi-magnify</v-icon>
          No lots found matching your search criteria
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
    filteredLotList() {
      console.log('Search query:', this.searchQuery, 'Type:', typeof this.searchQuery);
      console.log('Lot list length:', this.lotList.length);
      
      // Ensure searchQuery is a string
      const searchString = String(this.searchQuery || '').trim();
      
      if (!searchString) {
        return this.lotList;
      }
      
      const query = searchString.toLowerCase();
      
      const filtered = this.lotList.filter(lot => {
        const wmsCode = (lot.wms_code || "").toString().toLowerCase();
        const lotNo = (lot.lot_no || "").toString().toLowerCase();
        const supplier = (lot.supplier || "").toString().toLowerCase();
        
        const matches = wmsCode.includes(query) || 
                       lotNo.includes(query) || 
                       supplier.includes(query);
        
        return matches;
      });
      
      console.log('Filtered results:', filtered.length);
      return filtered;
    }
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
      wms_code: ""
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
    searchQuery: {
      type: String,
      default: "",
    },
  },
  watch: {
    searchQuery(newVal, oldVal) {
      console.log('Search query changed from:', oldVal, 'to:', newVal);
    }
  },
  methods: {
    analyseLot(item) {
      this.$emit("rowClicked", item);
     
    },
    editLot(item) {
      this.$emit("editLot", item);
    },
    getLots() {
      // const url = 'http://127.0.0.1:${this.url_port}';
      this.$refs.loadingModal.open();
      const url = `${this.url}:${this.url_port}`;
      console.warn(url);
      axios
        .get(`${url}/lots`, {
          withCredentials: false
        })
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
