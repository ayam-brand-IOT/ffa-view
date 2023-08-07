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
    1: { name: "BB", id: 0 },
    2: { name: "SBB", id: 1 },
    3: { name: "HD", id: 2 },
    4: { name: "M", id: 3 },
    5: { name: "S", id: 4 },
    6: { name: "LD", id: 5 },
    7: { name: "OS", id: 6 },
    8: { name: "OS2", id: 7 },
    9: { name: "O2", id: 8 },
    0: { name: "FB", id: 9 },
    "-": { name: "OSM", id: 10 },
    Control: { name: "SC", id: 11 },
    Shift: { name: "GR", id: 12 },
    CapsLock: { name: "T", id: 13 },
    Tab: { name: "ST", id: 14 },
    Escape: { name: "GC", id: 15 },
  },
  actions: {
    " ": "CAPTURE",
    c: "CANCEL",
    m: "TOGGLE",
  },
  url: function () {
    return "http://fish-analysis64.local:";
    return process.env.NODE_ENV == "production"
      ? "http://127.0.0.1:"
      : "http://fish-analysis64.local:";
  },
  url_server: function () {
    return process.env.NODE_ENV !== "production"
      ? // ? "http://127.0.0.1:33002/"
        "http://fish-analysis64.local:3030/"
      : "";
    return "";
  },
  url_port: function () {
    console.warn(process.env.NODE_ENV);
    // return process.env.NODE_ENV !== "production" ? "3002" : "33004";
    return "3002";
  },
};
