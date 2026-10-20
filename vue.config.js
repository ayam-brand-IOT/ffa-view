const fs = require("fs");
const path = require("path");
const { defineConfig } = require('@vue/cli-service')

// ffa-app serves the UI (and /manual/) from its own dist folder, so the build
// lands there directly; ffa-app sits next to this repo here and on the station.
// FFA_DIST overrides the target.
const outputDir = path.resolve(__dirname, process.env.FFA_DIST || "../ffa-app/dist");

// The build empties outputDir first; ffa-app tracks dist/.gitkeep, so put it back.
class KeepGitkeep {
  apply(compiler) {
    compiler.hooks.afterEmit.tap("KeepGitkeep", () => {
      // `serve` builds in memory and never touches outputDir.
      if (process.env.NODE_ENV !== "production") return;
      fs.writeFileSync(path.join(outputDir, ".gitkeep"), "");
    });
  }
}

module.exports = defineConfig({
  transpileDependencies: true,
  assetsDir: "static",
  outputDir,

  configureWebpack: {
    plugins: [new KeepGitkeep()],
  },

  pluginOptions: {
    vuetify: {
			// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
		}
  }
})
