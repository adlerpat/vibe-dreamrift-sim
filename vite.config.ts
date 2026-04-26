import { defineConfig } from "vite";

const repoName = "vibe-dreamrift-sim";

export default defineConfig(({ command }) => ({
  // GitHub Pages serves project sites from /<repo-name>/.
  base: command === "build" ? `/${repoName}/` : "/",
  server: {
    port: 5173,
  },
}));
