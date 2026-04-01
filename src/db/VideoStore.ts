import { createVideoPoster } from "@/lib/videoUtils";
import { BaseIndexedDB } from "./BaseIndexedDB";

export type VideoRecord = {
    id: string;
    original: Blob;
    poster: Blob;
    duration: number;
    createdAt: number;
    updatedAt: number;
};

export class VideoStore extends BaseIndexedDB<VideoRecord> {
    constructor() {
        super("media-db", ["photos", "google-photos", "local", "videos"], 4);
    }

    async create(id: string, file: File): Promise<void> {
        const poster = await createVideoPoster(file);
        const duration = await this.getDuration(file);

        await this.add({
            id,
            original: file,
            poster,
            duration,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    }

    async getPosterURL(id: string): Promise<string | null> {
        const rec = await this.get(id);
        return rec ? URL.createObjectURL(rec.poster) : null;
    }

    async getVideoURL(id: string): Promise<string | null> {
        const rec = await this.get(id);
        return rec ? URL.createObjectURL(rec.original) : null;
    }

    private getDuration(file: File): Promise<number> {
        return new Promise((resolve) => {
            const video = document.createElement("video");
            video.src = URL.createObjectURL(file);
            video.onloadedmetadata = () => {
                URL.revokeObjectURL(video.src);
                resolve(video.duration);
            };
        });
    }
}
