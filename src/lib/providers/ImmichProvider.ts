import type { ImageProvider } from "./types";
import type { ProviderContext } from "./index";

export class ImmichProvider implements ImageProvider {
    readonly name = "immich";
    private context: ProviderContext;

    constructor(context: ProviderContext) {
        this.context = context;
    }

    async next(): Promise<string | null> {
        const { immichSettings } = this.context;
        const { instanceUrl, apiKey, selectedPhotos = [], selectedAlbums = [], selectionMode } = immichSettings;
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
            
            return `${baseUrl}/api/assets/${assetId}/original?apiKey=${apiKey}`;
        } catch (error) {
            console.error("Error fetching Immich image:", error);
            return null;
        }
    }
}
