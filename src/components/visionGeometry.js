import axios from "axios";
import config from "../config";

// Size of the camera frame the analysis measures. Calibration clicks are
// converted to these pixels, whatever size the image is shown at.
export const FALLBACK_GEOMETRY = { width: 1280, height: 960 };

export async function fetchVisionGeometry() {
  const { data } = await axios.get(`${config.url_server()}vision_geometry`);
  return data;
}
