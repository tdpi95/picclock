import type { ImageProvider } from "./types";
import type { ProviderContext } from "./index";

const proxy = "https://whateverorigin.org/get?url=";
const bingUrl = encodeURIComponent(
    "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US",
);

const CACHE_STALE_TIME = 60 * 60 * 1000; // 1 hour

export class BingProvider implements ImageProvider {
    readonly name = "bing";
    private context: ProviderContext;
    
    constructor(context: ProviderContext) {
        this.context = context;
    }

    async next() {
        const { settings, updateWallpaperSettings } = this.context;
        const now = Date.now();

        if (settings.bing && settings.bing.imgUrl && settings.bing.lastFetch) {
            const timeDiff = now - settings.bing.lastFetch;
            if (timeDiff < CACHE_STALE_TIME) {
                console.log("Using cached Bing image:", settings.bing.imgUrl);
                return settings.bing.imgUrl;
            }
        }

        try {
            const bUrl = `${proxy}${bingUrl}`;
            console.log("Fetching new Bing image from: ", bUrl);
            const response = await fetch(bUrl);
            const data = await response.json();
            const contents = JSON.parse(data.contents);
            const image = contents.images[0];
            const imageUrl = `https://www.bing.com${image.url}`;
            
            updateWallpaperSettings({
                bing: {
                    lastFetch: now,
                    imgUrl: imageUrl,
                    title: image.title || "",
                    desc: image.copyright || "",
                }
            });

            return imageUrl;
        } catch (error) {
            console.error("Error fetching Bing image:", error);
            return settings.bing?.imgUrl || null;
        }
    }
}
