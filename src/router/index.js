import { createRouter, createWebHistory } from "vue-router";
import Vision from "../views/Vision.vue";
import LotInfo from "../views/LotInfo.vue";
import ExportLot from "../views/ExportLot.vue"
import HomeView from "../views/HomeView.vue";
import LoadCell from "../views/LoadCell.vue";
import Config from "../views/Configuration.vue";
import ConfigWrapper from "../views/ConfigWrapper.vue";

const routes = [
  {
    path: "/",
    name: "Frozen Fish Analyzer",
    component: HomeView,
  },
  {
    path: "/history",
    name: "History",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "history" */ "../views/History.vue"),
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
        path: "vision-calibration",
        name: "Calibrate vision",
        component: Vision,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
