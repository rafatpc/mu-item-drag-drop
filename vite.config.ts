import { defineConfig } from "vite";

export default defineConfig({
    build: {
        target: "esnext",
        lib: {
            entry: "src/storage-supervisor.ts",
            name: "MUItemDragging",
            formats: ["iife"],
            fileName: () => `mu-item-dragging.js`,
        },
        rollupOptions: {
            output: {
                footer: `window.StorageSupervisor = MUItemDragging.StorageSupervisor`,
            },
        },
    },
});
