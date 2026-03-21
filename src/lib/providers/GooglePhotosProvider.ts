import type { ImageProvider } from "./types";
import type { ProviderContext } from "./index";
import { ImageStore } from "@/db/ImageStore";

export class GooglePhotosProvider implements ImageProvider {
    readonly name = "google-photos";
    private store: ImageStore;

    constructor(_context: ProviderContext) {
        this.store = new ImageStore("google-photos");
    }

    async next(): Promise<string | null> {
        try {
            const keys = await this.store.getAllKeys();
            if (keys.length === 0) {
                console.warn("No Google Photos found in local storage.");
                return null;
            }

            // Pick a random image key
            const randomKey = keys[Math.floor(Math.random() * keys.length)];
            return await this.store.getOriginalURL(randomKey);
        } catch (err) {
            console.error("Error fetching from Google Photos store:", err);
            return null;
        }
    }
}
