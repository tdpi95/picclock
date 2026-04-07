import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["icon.png", "icon-192.png", "icon-512.png"],
            manifest: {
                name: "PicClock - Digital Photo Frame",
                short_name: "PicClock",
                description:
                    "Turn any device into a digital photo frame with a clock overlay.",
                theme_color: "#000000",
                background_color: "#000000",
                display: "fullscreen",
                start_url: "/picclock/",
                icons: [
                    {
                        src: "icon-192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                    {
                        src: "icon-512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                ],
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
            },
        }),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        outDir: "docs",
        sourcemap: true,
    },
    base: "/picclock/",
});
