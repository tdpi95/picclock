import type { ImageProvider } from "./types";
import type { ProviderContext } from "./index";

export class ImmichProvider implements ImageProvider {
    readonly name = "immich";
    private context: ProviderContext;

    constructor(context: ProviderContext) {
        this.context = context;
    }

    async next(): Promise<string | null> {
        const { settings } = this.context;
        if (!settings.immich) return null;

        const { instanceUrl, apiKey, selectedPhotos, selectedAlbums, selectionMode } = settings.immich;
        if (!instanceUrl || !apiKey) return null;

        try {
            let assetId: string | null = null;
            const baseUrl = instanceUrl.replace(/\/$/, "");

            if (selectionMode === "photos" && selectedPhotos.length > 0) {
                assetId = selectedPhotos[Math.floor(Math.random() * selectedPhotos.length)];
            } else if (selectionMode === "albums" && selectedAlbums.length > 0) {
                const albumId = selectedAlbums[Math.floor(Math.random() * selectedAlbums.length)];
                const response = await fetch(`${baseUrl}/api/albums/${albumId}`, {
                    headers: { "x-api-key": apiKey },
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch album: ${response.statusText}`);
                }
                
                const album = await response.json();
                if (album.assets && album.assets.length > 0) {
                    assetId = album.assets[Math.floor(Math.random() * album.assets.length)].id;
                }
            }

            if (!assetId) return null;

            // Using the original endpoint for high quality wallpaper
            // Immich supports key in query for some endpoints if configured, otherwise we might need a proxy or handle CORS.
            // For now, let's assume it works or the user handles it.
            return `${baseUrl}/api/assets/${assetId}/original?key=${apiKey}`;
        } catch (error) {
            console.error("Error fetching Immich image:", error);
            return null;
        }
    }
}
