import type { ImageProvider } from "./types";

export interface LocalImageStore {
    getOriginalURL(key: string): Promise<string | null>;
    getAllKeys(): Promise<string[]>;
}

export class LocalProvider implements ImageProvider {
    readonly name = "local";
    private listIdx = 0;
    private photoKeys: string[] = [];
    private store: LocalImageStore;

    constructor(store: LocalImageStore) {
        this.store = store;
    }

    async init() {
        this.photoKeys = await this.store.getAllKeys();
    }

    async next() {
        if (this.photoKeys.length === 0) {
            await this.init();
        }
        if (this.photoKeys.length === 0) return null;

        const url = await this.store.getOriginalURL(this.photoKeys[this.listIdx]);
        this.listIdx = (this.listIdx + 1) % this.photoKeys.length;
        console.log("Loading local image:", url);
        return url;
    }
}
