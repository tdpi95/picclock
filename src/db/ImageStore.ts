import { compressImage, createThumbnail } from "@/lib/imageUtils";
import { BaseIndexedDB } from "./BaseIndexedDB";

export type ImageRecord = {
    id: string;
    original: Blob;
    thumbnail: Blob;
    createdAt: number;
    updatedAt: number;
};

export class ImageStore extends BaseIndexedDB<ImageRecord> {
    constructor(storeName: string) {
        super("media-db", ["photos", "google-photos", "local", "videos"], 4); // Ensure all stores are created
        this.storeName = storeName; // Use the specific store for this instance
    }

    // protected onUpgrade(db: IDBDatabase): void {
    //     // No additional upgrade logic needed for now
    // }

    async create(id: string, file: Blob): Promise<void> {
        const [original, thumbnail] = await Promise.all([
            compressImage(file),
            createThumbnail(file),

            // if (!("OffscreenCanvas" in window)) {
            //     // fallback to main-thread canvas
            // }
            //compressInWorker(file, 1920, 0.85),
            //compressInWorker(file, 300, 0.7),
        ]);

        await this.add({
            id,
            original,
            thumbnail,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    }

    async update(id: string, file: File): Promise<void> {
        const existing = await this.get(id);
        if (!existing) throw new Error("Image not found");

        const [original, thumbnail] = await Promise.all([
            compressImage(file),
            createThumbnail(file),
        ]);

        await this.put({
            ...existing,
            original,
            thumbnail,
            updatedAt: Date.now(),
        });
    }

    async getThumbnailURL(id: string): Promise<string | null> {
        const rec = await this.get(id);
        return rec ? URL.createObjectURL(rec.thumbnail) : null;
    }

    async getOriginalURL(id: string): Promise<string | null> {
        const rec = await this.get(id);
        return rec ? URL.createObjectURL(rec.original) : null;
    }

    async save(id: string, file: Blob): Promise<void> {
        const [original, thumbnail] = await Promise.all([
            compressImage(file),
            createThumbnail(file),
        ]);

        const existing = await this.get(id);

        await this.put({
            id,
            original,
            thumbnail,
            createdAt: existing ? existing.createdAt : Date.now(),
            updatedAt: Date.now(),
        });
    }

    async exists(id: string): Promise<boolean> {
        const rec = await this.get(id);
        return !!rec;
    }
}
