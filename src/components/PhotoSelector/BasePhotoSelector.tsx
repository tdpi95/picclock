import { useState, useEffect } from "react";
import { Dialog } from "@/components/Dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FiCheck } from "react-icons/fi";
import type { Album, Photo, PhotoProvider } from "./types";

interface BasePhotoSelectorProps {
    visible: boolean;
    onClose: () => void;
    provider: PhotoProvider;
    selectedPhotoIds: string[];
    selectedAlbumIds: string[];
    selectionMode: "photos" | "albums";
    onSelectionChange: (params: {
        selectedPhotoIds?: string[];
        selectedAlbumIds?: string[];
        selectionMode?: "photos" | "albums";
    }) => void;
}

export function BasePhotoSelector({
    visible,
    onClose,
    provider,
    selectedPhotoIds,
    selectedAlbumIds,
    selectionMode,
    onSelectionChange,
}: BasePhotoSelectorProps) {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!visible) return;
        setLoading(true);
        Promise.all([provider.fetchAlbums(), provider.fetchPhotos()])
            .then(([albumsData, photosData]) => {
                setAlbums(albumsData);
                setPhotos(photosData);
            })
            .catch((err) => {
                console.error("Failed to fetch from provider:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [visible, provider]);

    const togglePhoto = (id: string) => {
        const newIds = selectedPhotoIds.includes(id)
            ? selectedPhotoIds.filter((i) => i !== id)
            : [...selectedPhotoIds, id];
        onSelectionChange({ selectedPhotoIds: newIds });
    };

    const toggleAlbum = (id: string) => {
        const newIds = selectedAlbumIds.includes(id)
            ? selectedAlbumIds.filter((i) => i !== id)
            : [...selectedAlbumIds, id];
        onSelectionChange({ selectedAlbumIds: newIds });
    };

    return (
        <Dialog
            visible={visible}
            onClose={onClose}
            header={`Select from ${provider.name}`}
            className="sm:max-w-4xl"
            footer={
                <Button onClick={onClose} className="px-8">
                    Done
                </Button>
            }
        >
            <Tabs
                value={selectionMode}
                onValueChange={(v) =>
                    onSelectionChange({ selectionMode: v as "photos" | "albums" })
                }
                className="w-full"
            >
                <div className="px-6 border-b">
                    <TabsList className="bg-transparent h-12 gap-6">
                        <TabsTrigger
                            value="photos"
                            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-12"
                        >
                            Photos ({selectedPhotoIds.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="albums"
                            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-12"
                        >
                            Albums ({selectedAlbumIds.length})
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="p-6 h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <span className="text-muted-foreground italic">Loading...</span>
                        </div>
                    ) : (
                        <>
                            <TabsContent value="photos" className="mt-0 outline-none">
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                    {photos.map((photo) => (
                                        <div
                                            key={photo.id}
                                            className={`relative aspect-square cursor-pointer rounded-xl overflow-hidden border-2 transition-all group ${
                                                selectedPhotoIds.includes(photo.id)
                                                    ? "border-amber-400 ring-2 ring-amber-400/20 shadow-md"
                                                    : "border-transparent hover:border-amber-400/50"
                                            }`}
                                            onClick={() => togglePhoto(photo.id)}
                                        >
                                            <img
                                                src={photo.thumbnailUrl}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                alt=""
                                            />
                                            {selectedPhotoIds.includes(photo.id) && (
                                                <div className="absolute top-1 right-1 bg-amber-400 text-black rounded-full p-0.5 shadow-md">
                                                    <FiCheck className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {photos.length === 0 && !loading && (
                                    <div className="text-center py-10 text-muted-foreground">
                                        No photos found
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="albums" className="mt-0 outline-none">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                                    {albums.map((album) => (
                                        <div
                                            key={album.id}
                                            className={`relative cursor-pointer group`}
                                            onClick={() => toggleAlbum(album.id)}
                                        >
                                            <div
                                                className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                                                    selectedAlbumIds.includes(album.id)
                                                        ? "border-amber-400 ring-2 ring-amber-400/20 shadow-lg"
                                                        : "border-transparent group-hover:border-amber-400/50"
                                                }`}
                                            >
                                                <img
                                                    src={album.thumbnailUrl}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                    alt=""
                                                />
                                                {selectedAlbumIds.includes(album.id) && (
                                                    <div className="absolute top-2 right-2 bg-amber-400 text-black rounded-full p-1 shadow-lg">
                                                        <FiCheck className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-2 text-center">
                                                <div className="font-semibold text-sm truncate px-1">
                                                    {album.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {album.assetCount} photos
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {albums.length === 0 && !loading && (
                                    <div className="text-center py-10 text-muted-foreground">
                                        No albums found
                                    </div>
                                )}
                            </TabsContent>
                        </>
                    )}
                </div>
            </Tabs>
        </Dialog>
    );
}
