import React, { useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import PhotoSelector from "./PhotoSelector";
import { LuImageUp } from "react-icons/lu";
import { NumberSelect } from "@/components/NumberSelect";
import { FieldGroup } from "@/components/ui/field";
import FormField from "@/components/FormField";

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

    const updateImageSource = (value: "picsum" | "bing" | "local") => {
        updateWallpaperSettings({ ...wallpaperSettings, imageSource: value });
    };

    return (
        <div className="p-4">
            <FieldGroup>
                <FormField label="Photo source" orientation="vertical">
                    <RadioGroup
                        value={wallpaperSettings.imageSource}
                        onValueChange={updateImageSource}
                        className="mt-3"
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
                                className="ml-2 cursor-pointer"
                            />
                        </div>
                    </RadioGroup>
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
            </FieldGroup>

            {showedPanel === "photoSelector" && (
                <PhotoSelector onClose={() => setShowedPanel("main")} />
            )}
        </div>
    );
};

export default WallpaperSettings;
