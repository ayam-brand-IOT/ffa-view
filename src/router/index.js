import { createRouter, createWebHistory } from "vue-router";
import LengthCalibration from "../views/LengthCalib.vue";
import ZOICalib from "../views/ZOICalib.vue";
import LotInfo from "../views/LotInfo.vue";
import ExportLot from "../views/ExportLot.vue"
import HomeView from "../views/HomeView.vue";
import LoadCell from "../views/LoadCell.vue";
import Config from "../views/Configuration.vue";
import ConfigWrapper from "../views/ConfigWrapper.vue";
import SelectLot from "@/views/SelectLot.vue";
import FishParameters from "../views/FishParameters.vue";

const routes = [
  {
    path: "/",
    name: "Select Lot",
    component: SelectLot,
  },
  {
    path: "/analyse-lot",
    name: "Analyse Lot",
    component: HomeView,
  },
  {
    path: "/log",
    name: "Log",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "log" */ "../views/Log.vue"),
  },
  {
    path: "/broken-belly-test",
    name: "Broken Belly Test",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "brokenBellyTest" */ "../views/BrokenBellyTest.vue"),
  },
  {
    path: "/muestra/:id",
    name: "Sample",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "muestra" */ "../views/Muestra.vue"),
  },
  {
    path: "/lot-images",
    name: "lotImages",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "lotImages" */ "../views/LotImages.vue"),
  },
  {
    path: "/config",
    name: "config",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "config" */ "../views/ConfigWrapper.vue"),
    children: [
      {
        path: "",
        name: "Configuration",
        component: Config,
      },
      {
        // UserProfile will be rendered inside User's <router-view>
        // when /user/:id/profile is matched
        path: "weight-calibration",
        name: "weightCalibration",
        component: LoadCell,
      },
      {
        // UserPosts will be rendered inside User's <router-view>
        // when /user/:id/posts is matched
        path: "zoi-calibration",
        name: "ZOI Calibration",
        component: ZOICalib,
      },
      {
        // UserPosts will be rendered inside User's <router-view>
        // when /user/:id/posts is matched
        path: "lot-info",
        name: "Lots Information",
        component: LotInfo,
      },
      {
        // UserPosts will be rendered inside User's <router-view>
        // when /user/:id/posts is matched
        path: "export-lot-data",
        name: "Export data",
        component: ExportLot,
      },
      {
        // UserPosts will be rendered inside User's <router-view>
        // when /user/:id/posts is matched
        path: "length-calibration",
        name: "Length calibration",
        component: LengthCalibration,
      },
      {
        // Fish parameters configuration
        path: "fish-parameters",
        name: "Fish Parameters",
        component: FishParameters,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
