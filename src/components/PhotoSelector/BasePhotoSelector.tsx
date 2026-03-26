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
    selectedPhotos: string[];
    selectedAlbums: string[];
    selectionMode: "photos" | "albums";
    onSelectionChange: (params: {
        selectedPhotos?: string[];
        selectedAlbums?: string[];
        selectionMode?: "photos" | "albums";
    }) => void;
}

export function BasePhotoSelector({
    visible,
    onClose,
    provider,
    selectedPhotos = [],
    selectedAlbums = [],
    selectionMode = "photos",
    onSelectionChange,
}: BasePhotoSelectorProps) {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [photoPage, setPhotoPage] = useState(1);
    const [hasMorePhotos, setHasMorePhotos] = useState(true);

    useEffect(() => {
        if (!visible) return;
        setLoading(true);
        setPhotoPage(1);
        setHasMorePhotos(true);

        Promise.all([provider.fetchAlbums(), provider.fetchPhotos(1)])
            .then(([albumsData, photosData]) => {
                setAlbums(albumsData);
                setPhotos(photosData);
                if (photosData.length < 50) setHasMorePhotos(false); // Assume 100 is max, but be safe
            })
            .catch((err) => {
                console.error("Failed to fetch from provider:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [visible, provider]);

    const loadMorePhotos = async () => {
        if (loadingMore || !hasMorePhotos || selectionMode !== "photos") return;

        setLoadingMore(true);
        const nextPage = photoPage + 1;

        try {
            const morePhotos = await provider.fetchPhotos(nextPage);
            if (morePhotos.length === 0) {
                setHasMorePhotos(false);
            } else {
                setPhotos((prev) => [...prev, ...morePhotos]);
                setPhotoPage(nextPage);
                if (morePhotos.length < 50) setHasMorePhotos(false);
            }
        } catch (err) {
            console.error("Failed to load more photos:", err);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 100) {
            loadMorePhotos();
        }
    };

    const togglePhoto = (id: string) => {
        const newIds = selectedPhotos.includes(id)
            ? selectedPhotos.filter((i) => i !== id)
            : [...selectedPhotos, id];
        onSelectionChange({ selectedPhotos: newIds });
    };

    const toggleAlbum = (id: string) => {
        const newIds = selectedAlbums.includes(id)
            ? selectedAlbums.filter((i) => i !== id)
            : [...selectedAlbums, id];
        onSelectionChange({ selectedAlbums: newIds });
    };

    return (
        <Dialog
            visible={visible}
            onClose={onClose}
            header={`Select from ${provider.name}`}
            className="lg:max-w-4xl"
            footer={
                <Button onClick={onClose} className="px-8">
                    Done
                </Button>
            }
        >
            <Tabs
                value={selectionMode}
                onValueChange={(v) =>
                    onSelectionChange({
                        selectionMode: v as "photos" | "albums",
                    })
                }
            >
                <TabsList className="w-full bg-white/30">
                    <TabsTrigger value="albums">
                        Albums ({selectedAlbums.length})
                    </TabsTrigger>
                    <TabsTrigger value="photos">
                        Photos ({selectedPhotos.length})
                    </TabsTrigger>
                </TabsList>

                <div
                    className="p-6 h-[60vh] overflow-y-auto"
                    onScroll={handleScroll}
                >
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <span className="text-muted-foreground italic">
                                Loading...
                            </span>
                        </div>
                    ) : (
                        <>
                            <TabsContent
                                value="photos"
                                className="mt-0 outline-none"
                            >
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                    {photos.map((photo) => (
                                        <div
                                            key={photo.id}
                                            className={`relative aspect-square cursor-pointer rounded-xl overflow-hidden border-2 transition-all group ${
                                                selectedPhotos.includes(
                                                    photo.id,
                                                )
                                                    ? "border-amber-400 ring-2 ring-amber-400/20 shadow-md"
                                                    : "border-transparent hover:border-amber-400/50"
                                            }`}
                                            onClick={() =>
                                                togglePhoto(photo.id)
                                            }
                                        >
                                            <img
                                                src={photo.thumbnailUrl}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                alt=""
                                            />
                                            {selectedPhotos.includes(
                                                photo.id,
                                            ) && (
                                                <div className="absolute top-1 right-1 bg-amber-400 text-black rounded-full p-0.5 shadow-md">
                                                    <FiCheck className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {loadingMore && (
                                    <div className="flex justify-center py-4">
                                        <span className="text-muted-foreground italic text-sm">
                                            Loading more...
                                        </span>
                                    </div>
                                )}

                                {photos.length === 0 && !loading && (
                                    <div className="text-center py-10 text-muted-foreground">
                                        No photos found
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent
                                value="albums"
                                className="mt-0 outline-none"
                            >
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                                    {albums.map((album) => (
                                        <div
                                            key={album.id}
                                            className={`relative cursor-pointer group`}
                                            onClick={() =>
                                                toggleAlbum(album.id)
                                            }
                                        >
                                            <div
                                                className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                                                    selectedAlbums.includes(
                                                        album.id,
                                                    )
                                                        ? "border-amber-400 ring-2 ring-amber-400/20 shadow-lg"
                                                        : "border-transparent group-hover:border-amber-400/50"
                                                }`}
                                            >
                                                <img
                                                    src={album.thumbnailUrl}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                    alt=""
                                                />
                                                {selectedAlbums.includes(
                                                    album.id,
                                                ) && (
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
