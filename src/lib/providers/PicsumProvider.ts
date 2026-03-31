import type { ImageProvider } from "./types";

export class PicsumProvider implements ImageProvider {
    readonly name = "picsum";
    async next() {
        const timestamp = Date.now();
        const initialUrl = `https://picsum.photos/1920/1080?random=${timestamp}`;
        
        try {
            const response = await fetch(initialUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.url;
        } catch (error) {
            console.error("Error fetching Picsum image:", error);
            return initialUrl;
        }
    }
}
