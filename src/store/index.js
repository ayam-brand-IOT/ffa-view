import { createStore } from 'vuex'
import config from '@/config';

export default createStore({
  state: {
    socket_instance: null,
    analyzing_lot: null,
    last_analysed_id: null,
  },
  getters: {
    getAnalyzingLotNo(state) {
      return state.analyzing_lot ? state.analyzing_lot.lot_no : config.NO_LOT_SELECTED;
    },
    getLastAnalysedId(state) {
      return state.last_analysed_id;
    }
  },
  mutations: {
    SET_SOCKET(state, socket_instance) {
      state.socket_instance = socket_instance;
    },
    SET_ANALYZING_LOT(state, lot) {
      state.analyzing_lot = lot;
    },
    SET_LAST_ANALysED_ID(state, id) {
      state.last_analysed_id = id;
    }
  },
  actions: {
    setSocketInstance({commit}, socket_instance) {
      commit("SET_SOCKET", socket_instance);
    },
    setAnalyzingLot({commit}, lot) {
      commit("SET_ANALYZING_LOT", lot);
    },
    setLastAnalysedId({commit}, id) {
      commit("SET_LAST_ANALysED_ID", id);
    }
  },
  modules: {
  }
})
