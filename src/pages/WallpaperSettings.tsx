import React, { useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import PhotoSelector from "./PhotoSelector";
import { LuImageUp } from "react-icons/lu";
import { FiSettings } from "react-icons/fi";
import { NumberSelect } from "@/components/NumberSelect";
import { FieldGroup } from "@/components/ui/field";
import FormField from "@/components/FormField";
import { Input } from "@/components/ui/input";
import { ImmichPhotoSelector } from "@/components/PhotoSelector/ImmichPhotoSelector";
import { Button } from "@/components/ui/button";

type PanelType = "main" | "photoSelector" | "clockSettings";

const WallpaperSettings: React.FC = () => {
    const { wallpaperSettings, updateWallpaperSettings } = useSettings();
    const [showedPanel, setShowedPanel] = useState<PanelType>("main");
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

    const updateImageSource = (value: "picsum" | "bing" | "local" | "immich") => {
        updateWallpaperSettings({ ...wallpaperSettings, imageSource: value });
    };

    const updateTransitionType = (value: "fade" | "slide" | "zoom") => {
        updateWallpaperSettings({ ...wallpaperSettings, transitionType: value });
    };

    return (
        <div className="p-4">
            <FieldGroup>
                <FormField label="Photo source" orientation="vertical">
                    <RadioGroup
                        value={wallpaperSettings.imageSource}
                        onValueChange={updateImageSource}
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
                            <LuImageUp
                                onClick={() => setShowedPanel("photoSelector")}
                                className="ml-2 cursor-pointer text-amber-400 hover:text-amber-500"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="immich" id="immich" />
                            <label htmlFor="immich">Immich</label>
                            {wallpaperSettings.imageSource === "immich" && (
                                <FiSettings
                                    onClick={() => setShowedPanel("photoSelector")}
                                    className="ml-2 cursor-pointer text-amber-400 hover:text-amber-500"
                                />
                            )}
                        </div>
                    </RadioGroup>
                </FormField>

                {wallpaperSettings.imageSource === "immich" && (
                    <div className="space-y-4 pt-2 border-t mt-2">
                        <FormField label="Instance URL" orientation="vertical">
                            <Input
                                placeholder="https://immich.example.com"
                                value={wallpaperSettings.immich?.instanceUrl || ""}
                                onChange={(e) =>
                                    updateWallpaperSettings({
                                        immich: {
                                            ...(wallpaperSettings.immich || {
                                                apiKey: "",
                                                selectedPhotos: [],
                                                selectedAlbums: [],
                                                selectionMode: "photos",
                                            }),
                                            instanceUrl: e.target.value,
                                        },
                                    })
                                }
                            />
                        </FormField>
                        <FormField label="API Key" orientation="vertical">
                            <Input
                                type="password"
                                placeholder="Immich API Key"
                                value={wallpaperSettings.immich?.apiKey || ""}
                                onChange={(e) =>
                                    updateWallpaperSettings({
                                        immich: {
                                            ...(wallpaperSettings.immich || {
                                                instanceUrl: "",
                                                selectedPhotos: [],
                                                selectedAlbums: [],
                                                selectionMode: "photos",
                                            }),
                                            apiKey: e.target.value,
                                        },
                                    })
                                }
                            />
                        </FormField>
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowedPanel("photoSelector")}
                                disabled={
                                    !wallpaperSettings.immich?.instanceUrl ||
                                    !wallpaperSettings.immich?.apiKey
                                }
                                className="border-amber-400 text-amber-400 hover:bg-amber-400/10"
                            >
                                <FiSettings className="mr-2" />
                                Select Photos/Albums
                            </Button>
                        </div>
                    </div>
                )}

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
                    <PhotoSelector onClose={() => setShowedPanel("main")} />
                )}

            {showedPanel === "photoSelector" &&
                wallpaperSettings.imageSource === "immich" &&
                wallpaperSettings.immich && (
                    <ImmichPhotoSelector
                        visible={true}
                        onClose={() => setShowedPanel("main")}
                        settings={wallpaperSettings.immich}
                        onSelectionChange={(params) => {
                            updateWallpaperSettings({
                                immich: {
                                    ...wallpaperSettings.immich!,
                                    ...params,
                                },
                            });
                        }}
                    />
                )}
        </div>
    );
};

export default WallpaperSettings;
