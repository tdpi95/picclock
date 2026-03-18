export * from "./types";
export * from "./PicsumProvider";
export * from "./BingProvider";
export * from "./LocalProvider";

import type { ImageProvider } from "./types";
import { PicsumProvider } from "./PicsumProvider";
import { BingProvider } from "./BingProvider";
import { LocalProvider } from "./LocalProvider";
import { ImmichProvider } from "./ImmichProvider";
import type { LocalImageStore } from "./LocalProvider";
import type { WallpaperSettings } from "@/context/SettingsContext";

export interface ProviderContext {
    settings: WallpaperSettings;
    updateWallpaperSettings: (settings: Partial<WallpaperSettings>) => void;
    store: LocalImageStore;
}

export function createProvider(source: string, context: ProviderContext): ImageProvider | null {
    switch (source) {
        case "picsum":
            return new PicsumProvider();
        case "bing":
            return new BingProvider(context);
        case "local":
            return new LocalProvider(context.store);
        case "immich":
            return new ImmichProvider(context);
        default:
            return null;
    }
}
