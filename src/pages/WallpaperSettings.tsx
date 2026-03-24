import React, { useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import LocalPhotoSelector from "../components/PhotoSelector/LocalPhotoSelector";
import { LuImageDown, LuImageUp } from "react-icons/lu";
import { FiSettings } from "react-icons/fi";
import { NumberSelect } from "@/components/NumberSelect";
import { FieldGroup } from "@/components/ui/field";
import FormField from "@/components/FormField";
import { ImmichPhotoSelector } from "@/components/PhotoSelector/ImmichPhotoSelector";
import { Button } from "@/components/ui/button";
import { FiRefreshCw } from "react-icons/fi";
import { SiGooglephotos, SiImmich } from "react-icons/si";
import { useImageStore } from "@/hooks/useImageStore";
import { GoogleDownloadedPhotosSelector } from "@/components/PhotoSelector/GoogleDownloadedPhotosSelector";
import { ImmichSettingsDialog } from "@/components/ImmichSettingsDialog";

type PanelType =
    | "main"
    | "photoSelector"
    | "clockSettings"
    | "googleDownloadedPhotos";

const WallpaperSettings: React.FC = () => {
    const { 
        wallpaperSettings, 
        updateWallpaperSettings,
        immichSettings,
        updateImmichSettings
    } = useSettings();
    const [showedPanel, setShowedPanel] = useState<PanelType>("main");
    const [isImmichSettingsOpen, setIsImmichSettingsOpen] = useState(false);
    const [intervalMinutes, setIntervalMinutes] = useState<number | "">(
        wallpaperSettings.imageChangeInterval / 60000,
    );
    const [wakeLockValue, setWakeLockValue] = useState<number | string>(
        wallpaperSettings.wakeLockDuration === -1
            ? "Disabled"
            : wallpaperSettings.wakeLockDuration === 0
              ? "Always on"
              : wallpaperSettings.wakeLockDuration / 60000,
    );

    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState({
        current: 0,
        total: 0,
    });
    const googlePhotoStore = useImageStore("google-photos");

    const downloadAndSavePhotos = async (
        sessionId: string,
        accessToken: string,
    ) => {
        console.log("downloadAndSavePhotos started for session:", sessionId);
        setDownloading(true);
        try {
            console.log("Fetching media items for session...");
            const res = await fetch(
                `https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                },
            );
            if (!res.ok) {
                const errText = await res.text();
                console.error(
                    "Failed to fetch media items:",
                    res.status,
                    errText,
                );
                throw new Error("Failed to fetch media items");
            }
            const data = await res.json();
            const items = data.mediaItems || [];

            setDownloadProgress({ current: 0, total: items.length });

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const baseUrl = item.mediaFile?.baseUrl;

                if (!baseUrl) {
                    console.warn(
                        `Item ${item.id} is missing baseUrl, skipping.`,
                    );
                    continue;
                }

                setDownloadProgress((p) => ({ ...p, current: i + 1 }));

                // Skip if already exists
                const alreadyExists = await googlePhotoStore.exists(item.id);
                if (alreadyExists) {
                    continue;
                }

                try {
                    // Fetch the image as a blob
                    const downloadUrl = `${baseUrl}=w2048-h2048`;
                    const imgRes = await fetch(downloadUrl, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    });
                    if (!imgRes.ok)
                        throw new Error(
                            `Failed to download ${item.id}: ${imgRes.status}`,
                        );

                    const blob = await imgRes.blob();

                    if (!blob.type.startsWith("image/")) {
                        console.warn(
                            `Item ${item.id} is not an image (type: ${blob.type}), skipping.`,
                        );
                        continue;
                    }

                    if (blob.size === 0) {
                        continue;
                    }

                    // Save (upsert) in IndexedDB
                    await googlePhotoStore.save(item.id, blob);
                } catch (err) {
                    console.error(`Error processing item ${item.id}:`, err);
                }
            }
            console.log("All photos processed!");
        } catch (err) {
            console.error("Error in downloadAndSavePhotos:", err);
        } finally {
            setDownloading(false);
            setDownloadProgress({ current: 0, total: 0 });
            // Trigger a refresh/re-render to ensure provider picks up new photos
            updateWallpaperSettings({ ...wallpaperSettings });
        }
    };

    const handleWakeLockValueChange = (value: number | string) => {
        console.log("Wake lock value change:", value);
        setWakeLockValue(value);
        let duration;
        if (value === "Disabled") {
            duration = -1;
        } else if (value === "Always on") {
            duration = 0;
        } else if (typeof value === "number") {
            duration = value * 60000;
        } else {
            console.warn("Invalid wake lock value:", value);
            return;
        }

        updateWallpaperSettings({
            ...wallpaperSettings,
            wakeLockDuration: duration,
        });
    };

    const handleInterValMinutesChange = (value: number | string) => {
        if (typeof value === "string") return;

        setIntervalMinutes(value);

        updateWallpaperSettings({
            ...wallpaperSettings,
            imageChangeInterval: value * 60000,
        });
    };

    const updateImageSource = (
        value: "picsum" | "bing" | "local" | "immich" | "google-photos",
    ) => {
        updateWallpaperSettings({ ...wallpaperSettings, imageSource: value });
    };

    const updateTransitionType = (value: "fade" | "slide" | "zoom") => {
        updateWallpaperSettings({
            ...wallpaperSettings,
            transitionType: value,
        });
    };

    const handleGooglePhotosClick = async () => {
        const startPickerFlow = async (token: string) => {
            try {
                const res = await fetch(
                    "https://photospicker.googleapis.com/v1/sessions",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            pickingConfig: {
                                maxItemCount: 50,
                            },
                        }),
                    },
                );
                if (!res.ok) {
                    const errData = await res.json();
                    console.error("Picker Session Error:", errData);
                    throw new Error(res.statusText);
                }
                const session = await res.json();
                if (session.pickerUri) {
                    window.open(
                        session.pickerUri + "/autoclose",
                        "google-photos-picker",
                        "width=800,height=900",
                    );

                    const poll = setInterval(async () => {
                        try {
                            const sRes = await fetch(
                                `https://photospicker.googleapis.com/v1/sessions/${session.id}`,
                                {
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                },
                            );
                            if (sRes.ok) {
                                const sData = await sRes.json();
                                if (
                                    sData.status === "PICKED" ||
                                    sData.mediaItemsSet === true
                                ) {
                                    console.log(
                                        "Session is ready! Starting download...",
                                    );
                                    clearInterval(poll);
                                    await downloadAndSavePhotos(
                                        session.id,
                                        token,
                                    );
                                } else if (sData.status === "EXPIRED") {
                                    console.log("Session expired.");
                                    clearInterval(poll);
                                }
                            } else if (sRes.status === 404) {
                                clearInterval(poll);
                            }
                        } catch (e) {
                            console.error("Error polling session:", e);
                            clearInterval(poll);
                        }
                    }, 3000);
                }
            } catch (err) {
                console.error("Error in picker flow:", err);
            }
        };

        const googlePhotos = wallpaperSettings.googlePhotos;
        const now = Date.now();

        if (googlePhotos?.accessToken && googlePhotos.tokenExpiry > now) {
            await startPickerFlow(googlePhotos.accessToken);
        } else {
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            if (!clientId) {
                alert("VITE_GOOGLE_CLIENT_ID is not set in .env");
                return;
            }

            // @ts-ignore
            const client = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: "https://www.googleapis.com/auth/photospicker.mediaitems.readonly",
                callback: (response: any) => {
                    if (response.access_token) {
                        updateWallpaperSettings({
                            googlePhotos: {
                                ...(wallpaperSettings.googlePhotos || {
                                    selectedPhotos: [],
                                    selectedAlbums: [],
                                    selectionMode: "photos",
                                }),
                                accessToken: response.access_token,
                                tokenExpiry:
                                    Date.now() + response.expires_in * 1000,
                            },
                        });
                        startPickerFlow(response.access_token);
                    }
                },
            });
            client.requestAccessToken();
        }
    };

    return (
        <div className="p-4">
            <FieldGroup>
                <FormField label="Photo source" orientation="vertical">
                    <RadioGroup
                        value={wallpaperSettings.imageSource}
                        onValueChange={updateImageSource}
                        className="mb-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="picsum" id="picsum" />
                            <label htmlFor="picsum">
                                Picsum (random photos)
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="bing" id="bing" />
                            <label htmlFor="bing">Bing Image of the Day</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="local" id="local" />
                            <label htmlFor="local">Local photos</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="immich" id="immich" />
                            <label htmlFor="immich">Immich</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem
                                value="google-photos"
                                id="google-photos"
                            />
                            <label htmlFor="google-photos">Google Photos</label>
                        </div>
                    </RadioGroup>

                    {/* Source Specific Actions */}
                    <div className="flex flex-wrap gap-2 justify-end">
                        {wallpaperSettings.imageSource === "local" && (
                            <Button
                                variant="outline-ghost"
                                size="sm"
                                onClick={() => setShowedPanel("photoSelector")}
                            >
                                <LuImageUp />
                                Manage Photos
                            </Button>
                        )}

                        {wallpaperSettings.imageSource === "immich" && (
                            <>
                                <Button
                                    variant="outline-ghost"
                                    size="sm"
                                    onClick={() =>
                                        setIsImmichSettingsOpen(true)
                                    }
                                >
                                    <FiSettings />
                                    Server Settings
                                </Button>
                                <Button
                                    variant="outline-ghost"
                                    size="sm"
                                    onClick={() =>
                                        setShowedPanel("photoSelector")
                                    }
                                    disabled={
                                        !immichSettings?.instanceUrl ||
                                        !immichSettings?.apiKey
                                    }
                                    className="text-amber-500"
                                >
                                    <SiImmich />
                                    Select Photos/Albums
                                </Button>
                            </>
                        )}

                        {wallpaperSettings.imageSource === "google-photos" && (
                            <>
                                <Button
                                    variant="outline-ghost"
                                    size="sm"
                                    onClick={() =>
                                        setShowedPanel("googleDownloadedPhotos")
                                    }
                                    disabled={downloading}
                                >
                                    <LuImageDown />
                                    Manage Downloaded Photos
                                </Button>

                                <Button
                                    variant="outline-ghost"
                                    className="text-amber-500"
                                    size="sm"
                                    onClick={handleGooglePhotosClick}
                                    disabled={downloading}
                                >
                                    <SiGooglephotos />
                                    Select Photos
                                </Button>
                            </>
                        )}
                    </div>

                    {downloading && (
                        <div className="mt-4 text-xs text-amber-500 animate-pulse flex items-center gap-2 justify-end">
                            <FiRefreshCw className="animate-spin" />
                            Downloading: {downloadProgress.current} /{" "}
                            {downloadProgress.total}
                        </div>
                    )}
                </FormField>

                {wallpaperSettings.imageSource !== "bing" && (
                    <FormField
                        label="Image change interval"
                        orientation="horizontal"
                    >
                        <NumberSelect
                            values={[1, 5, 10, 30, 60]}
                            unit="minute"
                            selectedValue={intervalMinutes}
                            min={1}
                            onValueChange={handleInterValMinutesChange}
                        />
                    </FormField>
                )}

                <FormField label="Keep screen on" orientation="horizontal">
                    <NumberSelect
                        values={["Disabled", "Always on", 5, 10, 30]}
                        unit="minute"
                        selectedValue={wakeLockValue}
                        min={1}
                        onValueChange={handleWakeLockValueChange}
                    />
                </FormField>

                <FormField label="Transition effect" orientation="vertical">
                    <RadioGroup
                        value={wallpaperSettings.transitionType}
                        onValueChange={updateTransitionType}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fade" id="fade" />
                            <label htmlFor="fade">Fade</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="slide" id="slide" />
                            <label htmlFor="slide">Slide</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="zoom" id="zoom" />
                            <label htmlFor="zoom">Zoom</label>
                        </div>
                    </RadioGroup>
                </FormField>
            </FieldGroup>

            {showedPanel === "photoSelector" &&
                wallpaperSettings.imageSource === "local" && (
                    <LocalPhotoSelector
                        onClose={() => setShowedPanel("main")}
                    />
                )}

            {showedPanel === "photoSelector" &&
                wallpaperSettings.imageSource === "immich" && (
                    <ImmichPhotoSelector
                        visible={true}
                        onClose={() => setShowedPanel("main")}
                        settings={immichSettings}
                        onSelectionChange={(params) => {
                            updateImmichSettings(params);
                        }}
                    />
                )}

            <GoogleDownloadedPhotosSelector
                visible={showedPanel === "googleDownloadedPhotos"}
                onClose={() => setShowedPanel("main")}
            />

            <ImmichSettingsDialog
                isOpen={isImmichSettingsOpen}
                onClose={() => setIsImmichSettingsOpen(false)}
                settings={immichSettings}
                onSave={(newImmichSettings) => {
                    updateImmichSettings(newImmichSettings);
                }}
            />
        </div>
    );
};

export default WallpaperSettings;
