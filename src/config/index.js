// ENSENADA DEV_PORT
// const DEV_PORT = "3002";
// LOCAL DEV_PORT
// const DEV_PORT = "33006";
const DEV_PORT = "3002";
const PROD_PORT = "3002";

// ENSENADA DEV_URL
const DEV_URL = "http://192.168.99.220";
// LOCAL DEV_URL
// const DEV_URL = "https://127.0.0.1:";

// ENSENADA URL_SERVER
const URL_SERVER = "http://192.168.99.220:3030/";
// LOCAL URL_SERVER
// const URL_SERVER = "http://127.0.0.1:33008/"



export default {
  NO_LOT_SELECTED: "Not selected",
  action_indexes: {
    tare: 0,
    setZero: 1,
    cancel: 2,
    capture: 3,
  },
  request_statuses: {
    requested: 0,
    onSucess: 1,
    onError: 2,
  },
  noOfDefects: 12,
  keys_to_filter: ["A", "B", "C", "D"],
  keys: [
    "1",
    "2",
    "3",
    "A",
    "4",
    "5",
    "6",
    "B",
    "7",
    "8",
    "9",
    "C",
    "*",
    "0",
    "#",
    "D",
  ],
  defects: {
    1: { name: "BB", id: 0, shortcut: "1", description: "BB" },
    2: { name: "SBB", id: 1, shortcut: "2", description: "SBB" },
    3: { name: "HD", id: 2, shortcut: "3", description: "HD" },
    4: { name: "M", id: 3, shortcut: "4", description: "M" },
    5: { name: "S", id: 4, shortcut: "5", description: "S" },
    6: { name: "LD", id: 5, shortcut: "6", description: "LD" },
    7: { name: "OS", id: 6, shortcut: "7", description: "OS" },
    8: { name: "OS2", id: 7, shortcut: "8", description: "OS2" },
    9: { name: "O2", id: 8, shortcut: "9", description: "O2" },
    0: { name: "FB", id: 9, shortcut: "0", description: "FB" },
    "-": { name: "OSM", id: 10, shortcut: "-", description: "OSM" },
    tab: { name: "ST", id: 14, shortcut: "tab", description: "ST" },
    shift: { name: "GR", id: 12, shortcut: "shift", description: "GR" },
    escape: { name: "GC", id: 15, shortcut: "escape", description: "GC" },
    control: { name: "SC", id: 11, shortcut: "control", description: "SC" },
    capslock: { name: "T", id: 13, shortcut: "capslock", description: "T" },
  },
  actions: {
    " ": { name: "CAPTURE", description: "Capture", shortcut: "space" },
    c: { name: "CANCEL", description: "Cancel", shortcut: "c" },
    m: { name: "TOGGLE", description: "Toggle", shortcut: "m" },
    z: { name: "ZERO", description: "Zero", shortcut: "z" },
    t: { name: "TARE", description: "Tare", shortcut: "t" },
    b: { name: "BBT", description: "Broken BT", shortcut: "b" },
    e: { name: "EXTRA", description: "Extra image", shortcut: "e" },
  },
  url: function () {
    const currentUrl = window.location.href;
    const urlObject = new URL(currentUrl);
    const hostname = urlObject.hostname;
    
    return process.env.NODE_ENV == "production"
      ? `http://${hostname}`
      : DEV_URL;
  },
  url_server: function () {
    return process.env.NODE_ENV == "production" ? "/": URL_SERVER;
  },
  url_port: function () {
    console.warn(process.env.NODE_ENV);
    return process.env.NODE_ENV == "production" ? PROD_PORT : DEV_PORT;
  },
};
