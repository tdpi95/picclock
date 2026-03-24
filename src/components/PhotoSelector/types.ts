export interface Album {
    id: string;
    name: string;
    thumbnailUrl: string;
    assetCount: number;
}

export interface Photo {
    id: string;
    thumbnailUrl: string;
}

export interface PhotoProvider {
    name: string;
    fetchAlbums(): Promise<Album[]>;
    fetchPhotos(page?: number): Promise<Photo[]>;
}
