import { useState, useEffect, useCallback } from "react";
import { Dialog } from "@/components/Dialog";
import { Button } from "@/components/ui/button";
import { FiTrash2, FiMaximize2 } from "react-icons/fi";
import { SiGooglephotos } from "react-icons/si";
import { useImageStore } from "@/hooks/useImageStore";

interface GoogleDownloadedPhotosSelectorProps {
    visible: boolean;
    onClose: () => void;
}

export function GoogleDownloadedPhotosSelector({
    visible,
    onClose,
}: GoogleDownloadedPhotosSelectorProps) {
    const [photos, setPhotos] = useState<
        { id: string; thumbnail: string; original: string }[]
    >([]);
    const [loading, setLoading] = useState(false);
    const store = useImageStore("google-photos");

    const loadPhotos = useCallback(async () => {
        setLoading(true);
        try {
            const keys = await store.getAllKeys();
            const photoData = await Promise.all(
                keys.map(async (key) => {
                    const thumb = await store.getThumbnailURL(key);
                    const original = await store.getOriginalURL(key);
                    return {
                        id: key,
                        thumbnail: thumb || "",
                        original: original || "",
                    };
                }),
            );
            setPhotos(photoData);
        } catch (err) {
            console.error("Failed to load downloaded photos:", err);
        } finally {
            setLoading(false);
        }
    }, [store]);

    useEffect(() => {
        if (visible) {
            loadPhotos();
        }
    }, [visible, loadPhotos]);

    const deletePhoto = async (id: string) => {
        if (confirm("Are you sure you want to delete this photo?")) {
            await store.delete(id);
            await loadPhotos();
        }
    };

    return (
        <Dialog
            visible={visible}
            onClose={onClose}
            header="Manage Downloaded Google Photos"
            footer={
                <Button onClick={onClose} className="px-8">
                    Done
                </Button>
            }
        >
            <div className="p-6 h-[60vh] overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <span className="text-muted-foreground italic">
                            Loading...
                        </span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {photos.map((photo) => (
                            <div
                                key={photo.id}
                                className="relative aspect-square rounded-xl overflow-hidden border border-border group bg-muted"
                            >
                                <img
                                    src={photo.thumbnail}
                                    className="w-full h-full object-cover"
                                    alt=""
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                        onClick={() =>
                                            window.open(
                                                photo.original,
                                                "_blank",
                                            )
                                        }
                                        className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
                                        title="View Original"
                                    >
                                        <FiMaximize2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deletePhoto(photo.id)}
                                        className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                                        title="Delete"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {photos.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <SiGooglephotos className="w-12 h-12 mb-4 opacity-20" />
                        <p>No photos downloaded yet.</p>
                        <p className="text-sm">
                            Use the "Select Photos" button to pick photos from
                            Google.
                        </p>
                    </div>
                )}
            </div>
        </Dialog>
    );
}
