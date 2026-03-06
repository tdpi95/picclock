import { FiLink, FiPlus, FiUpload, FiX } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useImageStore } from "@/hooks/useImageStore";
import IconToggle from "@/components/ui/IconToggle";
import { useEffect, useRef, useState } from "react";
import ImageURLForm from "./ImageURLForm";
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

export default function PhotoSelector({ onClose }: PhotoSelectorProps) {
    const photoStore = useImageStore("photos");
    const { wallpaperSettings, updateWallpaperSettings } = useSettings();
    const [photos, setPhotos] = useState<Photo[]>([]);

    const [mode, setMode] = useState<AddMode>(wallpaperSettings.uploadMode);
    const [showUrlForm, setShowUrlForm] = useState(false);

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

        for (const blob of selected) {
            const id = generateUUID();
            photoStore.create(id, blob).then(() => {
                photoStore.getThumbnailURL(id).then((thumbUrl) => {
                    if (thumbUrl) {
                        setPhotos((prev) => [...prev, { id, thumbUrl }]);
                    }
                });
            });
        }
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
                header="Photo Selector"
                className="sm:max-w-4xl"
                footer={
                    <Button
                        type="button"
                        variant="default"
                        className="px-8"
                        onClick={onClose}
                    >
                        OK
                    </Button>
                }
            >
                <div className="px-6 py-2">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                        {photos.map((photo, index) => (
                            <div
                                key={photo.id}
                                className="relative aspect-square overflow-hidden rounded-xl shadow w-30 h-30 border border-white"
                            >
                                <img
                                    src={photo.thumbUrl}
                                    alt={`photo-${index}`}
                                    className="h-full w-full object-cover"
                                />
                                <Button
                                    size="icon"
                                    variant="destructive"
                                    className="absolute top-1 right-1 h-7 w-7 rounded-full bg-destructive/70"
                                    onClick={() => removeImage(photo.id)}
                                >
                                    <FiX className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        {photos.length < MAX_IMAGES && (
                            <div className="relative w-30 flex flex-col aspect-square items-center justify-center rounded-xl border border-white bg-white/50 text-muted-foreground shadow-md">
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
