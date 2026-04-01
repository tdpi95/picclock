import {
    FiLink,
    FiMaximize2,
    FiPlus,
    FiTrash2,
    FiUpload,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useImageStore } from "@/hooks/useImageStore";
import IconToggle from "@/components/ui/IconToggle";
import { useEffect, useRef, useState } from "react";
import ImageURLForm from "../../pages/ImageURLForm";
import { useSettings } from "@/context/SettingsContext";
import { generateUUID } from "@/lib/utils";
import { Dialog } from "@/components/Dialog";

const MAX_IMAGES = 60;

type AddMode = "file" | "url";

export interface PhotoSelectorProps {
    onClose: () => void;
}

type Photo = {
    id: string;
    thumbUrl: string;
};

export default function LocalPhotoSelector({ onClose }: PhotoSelectorProps) {
    const photoStore = useImageStore("photos");
    const { wallpaperSettings, updateWallpaperSettings } = useSettings();
    const [photos, setPhotos] = useState<Photo[]>([]);

    const [mode, setMode] = useState<AddMode>(wallpaperSettings.uploadMode);
    const [showUrlForm, setShowUrlForm] = useState(false);
    const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const urls: string[] = [];

        async function load() {
            const ids = await photoStore.getAllKeys();

            const items = await Promise.all(
                ids.map(async (id) => {
                    const thumbUrl = await photoStore.getThumbnailURL(id);
                    if (!thumbUrl) return null;
                    urls.push(thumbUrl);
                    return { id, thumbUrl };
                }),
            );

            setPhotos(items.filter(Boolean) as Photo[]);
        }

        load();

        return () => {
            // prevent memory leaks
            urls.forEach(URL.revokeObjectURL);
        };
    }, [photoStore]);

    const handleAddClick = (mode: AddMode) => {
        if (mode === "url") {
            setShowUrlForm(true);
        } else {
            fileInputRef.current?.click();
        }
    };

    const addBlobs = (blobs: Blob[]) => {
        if (!blobs.length) return;

        const remaining = MAX_IMAGES - photos.length;
        const selected = blobs.slice(0, remaining);

        const promises = selected.map(async (blob) => {
            const id = generateUUID();
            await photoStore.create(id, blob);
            const thumbUrl = await photoStore.getThumbnailURL(id);
            if (thumbUrl) {
                setPhotos((prev) => [...prev, { id, thumbUrl }]);
            }
        });

        Promise.all(promises).then(() => {
            window.dispatchEvent(new CustomEvent("wallpaper-refresh"));
        });
    };

    const addUrls = (urls: string[]) => {
        const remaining = MAX_IMAGES - photos.length;
        const selected = urls.slice(0, remaining);
        console.log("Adding URLs:", selected);
        const blobs = selected.map(async (url) => {
            try {
                const res = await fetch(url);
                return await res.blob();
            } catch (err) {
                console.error("Failed to fetch image from URL:", url, err);
                return null;
            }
        });

        Promise.all(blobs).then((results) => {
            const validBlobs = results.filter((b): b is Blob => b !== null);
            addBlobs(validBlobs);
        });
    };

    const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);

        addBlobs(files);

        e.target.value = "";
    };

    const removeImage = (id: string) => {
        photoStore.delete(id);
        setPhotos((prev) => prev.filter((photo) => photo.id !== id));
    };

    return (
        <>
            <Dialog
                visible={true}
                onClose={onClose}
                header="Local Photo Selector"
                className="sm:max-w-4xl"
                footer={
                    <Button
                        type="button"
                        variant="default"
                        className="px-8"
                        onClick={onClose}
                    >
                        Done
                    </Button>
                }
            >
                <div className="px-6 py-2" onClick={() => setSelectedPhotoId(null)}>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {photos.map((photo, index) => (
                            <div
                                key={photo.id}
                                className="relative aspect-square overflow-hidden rounded-xl shadow border border-white cursor-pointer group"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPhotoId(selectedPhotoId === photo.id ? null : photo.id);
                                }}
                            >
                                <img
                                    src={photo.thumbUrl}
                                    alt={`photo-${index}`}
                                    className="h-full w-full object-cover"
                                />

                                <div className={`absolute inset-0 bg-black/40 ${selectedPhotoId === photo.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity flex items-center justify-center gap-3`}>
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            const url =
                                                await photoStore.getOriginalURL(
                                                    photo.id,
                                                );
                                            if (url) window.open(url, "_blank");
                                        }}
                                        className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
                                        title="View Original"
                                    >
                                        <FiMaximize2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeImage(photo.id);
                                        }}
                                        className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                                        title="Delete"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {photos.length < MAX_IMAGES && (
                            <div className="relative flex flex-col aspect-square items-center justify-center rounded-xl border border-white bg-white/50 text-muted-foreground shadow-md">
                                <button
                                    type="button"
                                    onClick={() => handleAddClick(mode)}
                                    className="rounded-md hover:bg-white/90"
                                >
                                    <FiPlus className="h-10 w-10" />
                                </button>
                                <IconToggle
                                    className="absolute bottom-1"
                                    enabled={mode === "url"}
                                    onChange={(s) => {
                                        const newMode = s ? "url" : "file";
                                        setMode(newMode);
                                        updateWallpaperSettings({
                                            ...wallpaperSettings,
                                            uploadMode: newMode,
                                        });
                                    }}
                                    leftIcon={<FiUpload />}
                                    rightIcon={<FiLink />}
                                    height={26}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Dialog>
            {showUrlForm && (
                <ImageURLForm
                    onClose={() => setShowUrlForm(false)}
                    onSave={(urls) => addUrls(urls)}
                    maxUrls={MAX_IMAGES - photos.length}
                />
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFilesSelected}
            />
        </>
    );
}
