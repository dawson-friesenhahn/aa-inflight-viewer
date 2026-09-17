import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
    build: {
        outDir: "static/dist",
        emptyOutDir: true,
        rolldownOptions: {
            input: resolve(__dirname, "js_src/map_view.js"),
            output: {
                "entryFileNames": "[name].js"
            }
        },
    },
});
