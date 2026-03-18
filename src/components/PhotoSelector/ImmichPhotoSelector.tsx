import { BasePhotoSelector } from "./BasePhotoSelector";
import type { PhotoProvider } from "./types";
import type { ImmichSettings } from "@/context/SettingsContext";

interface ImmichPhotoSelectorProps {
    visible: boolean;
    onClose: () => void;
    settings: ImmichSettings;
    onSelectionChange: (params: {
        selectedPhotoIds?: string[];
        selectedAlbumIds?: string[];
        selectionMode?: "photos" | "albums";
    }) => void;
}

export function ImmichPhotoSelector({
    visible,
    onClose,
    settings,
    onSelectionChange,
}: ImmichPhotoSelectorProps) {
    const provider: PhotoProvider = {
        name: "Immich",
        fetchAlbums: async () => {
            const { instanceUrl, apiKey } = settings;
            if (!instanceUrl || !apiKey) return [];
            
            const baseUrl = instanceUrl.replace(/\/$/, "");
            try {
                const res = await fetch(`${baseUrl}/api/albums`, {
                    headers: { "x-api-key": apiKey },
                });
                
                if (!res.ok) {
                    console.error("Failed to fetch albums:", res.statusText);
                    return [];
                }
                
                const data = await res.json();
                return data.map((a: any) => ({
                    id: a.id,
                    name: a.albumName,
                    thumbnailUrl: `${baseUrl}/api/assets/${a.albumThumbnailAssetId}/thumbnail?key=${apiKey}`,
                    assetCount: a.assetCount,
                }));
            } catch (err) {
                console.error("Error fetching Immich albums:", err);
                return [];
            }
        },
        fetchPhotos: async () => {
            const { instanceUrl, apiKey } = settings;
            if (!instanceUrl || !apiKey) return [];
            
            const baseUrl = instanceUrl.replace(/\/$/, "");
            try {
                const res = await fetch(`${baseUrl}/api/assets?isArchived=false`, {
                    headers: { "x-api-key": apiKey },
                });
                
                if (!res.ok) {
                    console.error("Failed to fetch assets:", res.statusText);
                    return [];
                }
                
                const data = await res.json();
                // We'll limit the photos to the first 100 for browsing performance 
                // in the selector, or maybe the first page is enough.
                return data.slice(0, 100).map((a: any) => ({
                    id: a.id,
                    thumbnailUrl: `${baseUrl}/api/assets/${a.id}/thumbnail?key=${apiKey}`,
                }));
            } catch (err) {
                console.error("Error fetching Immich photos:", err);
                return [];
            }
        },
    };

    return (
        <BasePhotoSelector
            visible={visible}
            onClose={onClose}
            provider={provider}
            selectedPhotoIds={settings.selectedPhotos}
            selectedAlbumIds={settings.selectedAlbums}
            selectionMode={settings.selectionMode}
            onSelectionChange={onSelectionChange}
        />
    );
}
