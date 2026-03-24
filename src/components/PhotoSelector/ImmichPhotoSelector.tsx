import { useMemo } from "react";
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
    const provider: PhotoProvider = useMemo(() => ({
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
                    thumbnailUrl: `${baseUrl}/api/assets/${a.albumThumbnailAssetId}/thumbnail?apiKey=${apiKey}`,
                    assetCount: a.assetCount,
                }));
            } catch (err) {
                console.error("Error fetching Immich albums:", err);
                return [];
            }
        },
        fetchPhotos: async (page = 1) => {
            const { instanceUrl, apiKey } = settings;
            if (!instanceUrl || !apiKey) return [];
            
                const baseUrl = instanceUrl.replace(/\/$/, "");
                try {
                    const res = await fetch(`${baseUrl}/api/search/metadata`, {
                        method: "POST",
                        headers: { 
                            "x-api-key": apiKey,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            withArchived: false,
                            size: 100,
                            page: page,
                            type: "IMAGE"
                        })
                    });
                
                if (!res.ok) {
                    console.error("Failed to fetch assets via search:", res.statusText);
                    return [];
                }
                
                const data = await res.json();
                const assets = data.assets?.items || [];
                
                return assets.map((a: any) => ({
                    id: a.id,
                    thumbnailUrl: `${baseUrl}/api/assets/${a.id}/thumbnail?apiKey=${apiKey}`,
                }));
            } catch (err) {
                console.error("Error fetching Immich photos:", err);
                return [];
            }
        },
    }), [settings.instanceUrl, settings.apiKey]);

    return (
        <BasePhotoSelector
            visible={visible}
            onClose={onClose}
            provider={provider}
            selectedPhotos={settings.selectedPhotos}
            selectedAlbums={settings.selectedAlbums}
            selectionMode={settings.selectionMode}
            onSelectionChange={onSelectionChange}
        />
    );
}
