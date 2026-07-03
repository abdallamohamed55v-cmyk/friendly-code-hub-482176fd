import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // Static HTML templates under public/templates/* import 3D libs from CDNs
    // (three/addons, stats-gl, etc.) directly in the browser. Vite's dep
    // scanner tries to resolve them from node_modules and warns on every boot.
    // They are not part of the app bundle — exclude them from scanning.
    entries: ["index.html", "src/**/*.{ts,tsx}"],
    exclude: ["msw", "@mswjs/interceptors", "@tanstack/react-start", "@tanstack/start-server-core"],
  },

  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    minify: "esbuild",
    // Fully disable modulepreload. Vite's default behavior preloads the
    // transitive graph of every async chunk from the entry, which meant the
    // landing page eagerly fetched ~1MB of markdown/syntax/icons/chat code
    // even though those chunks are only used inside authenticated routes.
    // Each lazy route now fetches its own chunks strictly on demand.
    modulePreload: false,
    rollupOptions: {
      external: [/^npm:/, /^https?:\/\//, /^jsr:/, /^node:/],
      output: {
        // Keep only the truly universal runtime packages in a shared vendor
        // chunk. Everything else is left to Rollup's default splitter so that
        // route-specific dependencies (markdown, syntax highlighting, lobehub
        // brand icons, radix widgets, framer-motion, etc.) travel with the
        // async chunk that actually uses them instead of being force-hoisted
        // into the entry graph. This is the fix for the "landing page loads
        // 3.9 MB of JS" regression.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (
            id.includes("/react-dom/") ||
            id.includes("/react/") ||
            id.includes("scheduler") ||
            id.includes("react-router")
          ) {
            return "react-vendor";
          }
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("@lobehub")) return "lobehub-icons";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("@radix-ui")) return "radix";
          if (
            id.includes("react-markdown") ||
            id.includes("remark-") ||
            id.includes("rehype-") ||
            id.includes("micromark") ||
            id.includes("mdast-") ||
            id.includes("hast-")
          ) {
            return "markdown";
          }
          if (id.includes("react-syntax-highlighter") || id.includes("refractor") || id.includes("prismjs") || id.includes("highlight.js")) {
            return "syntax";
          }
          if (id.includes("@tanstack")) return "tanstack";
          if (id.includes("date-fns") || id.includes("dayjs")) return "date";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
        },
      },
    },

  },
});
