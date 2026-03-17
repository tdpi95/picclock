import type { ImageProvider } from "./types";

export class PicsumProvider implements ImageProvider {
    readonly name = "picsum";
    async next() {
        const timestamp = Date.now();
        console.log("Get new Picsum image");
        return `https://picsum.photos/1920/1080?random=${timestamp}`;
    }
}
