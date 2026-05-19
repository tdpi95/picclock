import React, { useState } from "react";
import { useSettings, type TransitionType } from "../context/SettingsContext";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import LocalPhotoSelector from "../components/PhotoSelector/LocalPhotoSelector";
import { LuImageUp } from "react-icons/lu";
import { FiSettings } from "react-icons/fi";
import { NumberSelect } from "@/components/NumberSelect";
import { FieldGroup } from "@/components/ui/field";
import FormField from "@/components/FormField";
import { ImmichPhotoSelector } from "@/components/PhotoSelector/ImmichPhotoSelector";
import { Button } from "@/components/ui/button";
import { SiImmich } from "react-icons/si";
import { ImmichSettingsDialog } from "@/components/ImmichSettingsDialog";

import { useTranslation } from "@/lib/translations";

type PanelType =
    | "main"
    | "photoSelector"
    | "clockSettings";

const WallpaperSettings: React.FC = () => {
    const {
        wallpaperSettings,
        updateWallpaperSettings,
        immichSettings,
        updateImmichSettings,
    } = useSettings();
    const { t } = useTranslation();
    const [showedPanel, setShowedPanel] = useState<PanelType>("main");
    const [isImmichSettingsOpen, setIsImmichSettingsOpen] = useState(false);
    const [intervalMinutes, setIntervalMinutes] = useState<number | "">(
        wallpaperSettings.imageChangeInterval / 60000,
    );
    const [wakeLockValue, setWakeLockValue] = useState<number | string>(
        wallpaperSettings.wakeLockDuration === -1
            ? t("disabled")
            : wallpaperSettings.wakeLockDuration === 0
              ? t("alwaysOn")
              : wallpaperSettings.wakeLockDuration / 60000,
    );

    const handleWakeLockValueChange = (value: number | string) => {
        console.log("Wake lock value change:", value);
        setWakeLockValue(value);
        let duration;
        if (value === t("disabled")) {
            duration = -1;
        } else if (value === t("alwaysOn")) {
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

    const updateTransitionType = (value: TransitionType) => {
        updateWallpaperSettings({
            ...wallpaperSettings,
            transitionType: value,
        });
    };

    const updateWallpaperPosition = (value: "fill" | "fit") => {
        updateWallpaperSettings({
            ...wallpaperSettings,
            wallpaperPosition: value,
        });
    };

    return (
        <div className="p-4">
            <FieldGroup>
                <FormField label={t("photoSource")} orientation="vertical">
                    <RadioGroup
                        value={wallpaperSettings.imageSource}
                        onValueChange={updateImageSource}
                        className="mb-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="picsum" id="picsum" />
                            <label htmlFor="picsum">
                                {t("picsum")}
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="bing" id="bing" />
                            <label htmlFor="bing">{t("bing")}</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="local" id="local" />
                            <label htmlFor="local">{t("local")}</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="immich" id="immich" />
                            <label htmlFor="immich">{t("immich")}</label>
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
                                {t("managePhotos")}
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
                                    {t("serverSettings")}
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
                                    {t("selectPhotosAlbums")}
                                </Button>
                            </>
                        )}                        
                    </div>

                </FormField>

                {wallpaperSettings.imageSource !== "bing" && (
                    <FormField
                        label={t("imageChangeInterval")}
                        orientation="horizontal"
                    >
                        <NumberSelect
                            values={[1, 5, 10, 30, 60]}
                            unit={t("minute")}
                            selectedValue={intervalMinutes}
                            min={1}
                            onValueChange={handleInterValMinutesChange}
                        />
                    </FormField>
                )}

                <FormField label={t("keepScreenOn")} orientation="horizontal">
                    <NumberSelect
                        values={[t("disabled"), t("alwaysOn"), 5, 10, 30]}
                        unit={t("minute")}
                        selectedValue={wakeLockValue}
                        min={1}
                        onValueChange={handleWakeLockValueChange}
                    />
                </FormField>

                <FormField label={t("transitionEffect")} orientation="vertical">
                    <RadioGroup
                        value={wallpaperSettings.transitionType}
                        onValueChange={updateTransitionType}
                        className="grid grid-cols-2 gap-2"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fade" id="fade" />
                            <label htmlFor="fade">{t("fade")}</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="blur" id="blur" />
                            <label htmlFor="blur">{t("blur")}</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="slide" id="slide" />
                            <label htmlFor="slide">{t("slideHorizontal")}</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="slideVertical" id="slideVertical" />
                            <label htmlFor="slideVertical">{t("slideVertical")}</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="zoomOut" id="zoomOut" />
                            <label htmlFor="zoomOut">{t("zoomOut")}</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="kenBurns" id="kenBurns" />
                            <label htmlFor="kenBurns">{t("kenBurns")}</label>
                        </div>
                    </RadioGroup>
                </FormField>

                <FormField label={t("wallpaperPosition")} orientation="vertical">
                    <RadioGroup
                        value={wallpaperSettings.wallpaperPosition}
                        onValueChange={updateWallpaperPosition}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fill" id="fill" />
                            <label htmlFor="fill">{t("fill")}</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fit" id="fit" />
                            <label htmlFor="fit">{t("fit")}</label>
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
