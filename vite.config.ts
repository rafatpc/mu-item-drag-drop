import { defineConfig } from "vite";

export default defineConfig({
    build: {
        target: "esnext",
        lib: {
            entry: "src/storage-supervisor.ts",
            name: "StorageSupervisor",
            formats: ["iife"],
            fileName: () => `mu-item-dragging.js`,
        },
    },
});
