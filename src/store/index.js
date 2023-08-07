import { createStore } from 'vuex'
import config from '@/config';

export default createStore({
  state: {
    socket_instance: null,
    analyzing_lot: null,
  },
  getters: {
    getAnalyzingLotNo(state) {
      return state.analyzing_lot ? state.analyzing_lot.lot_no : config.NO_LOT_SELECTED;
    }
  },
  mutations: {
    SET_SOCKET(state, socket_instance) {
      state.socket_instance = socket_instance;
    },
    SET_ANALYZING_LOT(state, lot) {
      state.analyzing_lot = lot;
    }
  },
  actions: {
    setSocketInstance({commit}, socket_instance) {
      commit("SET_SOCKET", socket_instance);
    },
    setAnalyzingLot({commit}, lot) {
      commit("SET_ANALYZING_LOT", lot);
    }
  },
  modules: {
  }
})
