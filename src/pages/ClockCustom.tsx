import FontSelector from "@/components/FontSelector";
import FormField from "@/components/FormField";
import PositionSelector from "@/components/PositionSelector";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
    useSettings,
    type MovementType,
    type Position,
} from "@/context/SettingsContext";
import { loadGoogleFont } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/translations";

const fonts = [
    "Inter",
    "Open Sans",
    "Playfair Display",
    "Merriweather",
    "Oswald",
    "MonteCarlo",
    "Aldrich",
    "Shizuru",
];

const ClockCustom = () => {
    const { clockSettings, updateClockSettings } = useSettings();
    const { t } = useTranslation();
    const [showedPanel, setShowedPanel] = useState<
        "none" | "photoSelector" | "positionSelector"
    >("none");

    useEffect(() => {
        loadGoogleFont(clockSettings.font);
    }, [clockSettings.font]);

    const updateMovement = (movement: MovementType) => {
        updateClockSettings({ ...clockSettings, movement });
    };

    const updateVisible = (visible: boolean) => {
        updateClockSettings({ ...clockSettings, visible });
    };

    const update24h = (twentyFourHour: boolean) => {
        updateClockSettings({ ...clockSettings, _24h: twentyFourHour });
    };
    const updateBgBlur = (bgBlur: boolean) => {
        updateClockSettings({ ...clockSettings, bgBlur });
    };

    const handleSelectorOpen = () => {
        fonts.forEach(loadGoogleFont);
    };

    const updateFont = (font: string) => {
        updateClockSettings({ ...clockSettings, font });
    };

    const updatePosition = (position: Position) => {
        updateClockSettings({ ...clockSettings, position });
    };

    const resetClockPosition = () => {
        toast(t("clockPositionReset"), {
            duration: 3000,
        });
        updateClockSettings({ ...clockSettings, position: { x: 100, y: 100 } });
    };

    return (
        <div className="p-4">
            <FieldGroup>
                <FieldLabel>
                    <Field orientation={"horizontal"}>
                        <FieldTitle>{t("visible")}</FieldTitle>
                        <Switch
                            checked={clockSettings.visible}
                            onCheckedChange={updateVisible}
                        />
                    </Field>
                </FieldLabel>
                <FieldLabel>
                    <Field orientation={"horizontal"}>
                        <FieldTitle>{t("_24h")}</FieldTitle>
                        <Switch
                            checked={clockSettings._24h}
                            onCheckedChange={update24h}
                        />
                    </Field>
                </FieldLabel>
                <FieldLabel>
                    <Field orientation={"horizontal"}>
                        <FieldTitle>{t("bgBlur")}</FieldTitle>
                        <Switch
                            checked={clockSettings.bgBlur}
                            onCheckedChange={updateBgBlur}
                        />
                    </Field>
                </FieldLabel>
                <FormField label={t("font")} orientation="horizontal">
                    <Button
                        variant="outline-ghost"
                        onClick={() => setShowedPanel("photoSelector")}
                    >
                        <p
                            style={{
                                fontFamily: `'${clockSettings.font}', sans-serif`,
                            }}
                        >
                            {clockSettings.font}
                        </p>
                    </Button>
                </FormField>
                <FormField label={t("size")} orientation="horizontal">
                    <div className="flex items-center gap-4 w-48 custom-slider-wrapper max-sm:w-full">
                        <Slider
                            min={1}
                            max={20}
                            step={0.1}
                            value={clockSettings.fontSize}
                            onValueChange={(val) =>
                                updateClockSettings({
                                    ...clockSettings,
                                    fontSize: val,
                                })
                            }
                        />
                        <span className="text-sm font-mono w-10 text-right">
                            {clockSettings.fontSize.toFixed(1)}
                        </span>
                    </div>
                </FormField>
                <FormField label={t("movement")} orientation="vertical">
                    <RadioGroup
                        value={clockSettings?.movement}
                        onValueChange={(value: MovementType) => {
                            updateMovement(value);
                        }}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem
                                value="continuous"
                                id="continuous"
                            />
                            <label htmlFor="continuous">
                                {t("continuous")}
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="interval" id="interval" />
                            <label htmlFor="interval">{t("interval")}</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="static" id="static" />
                            <label htmlFor="static">{t("static")}</label>
                        </div>
                    </RadioGroup>
                    <div className="mt-2 space-y-2">
                        {clockSettings.movement === "static" && (
                            <>
                                <p className="text-xs italic">
                                    {t("tipStatic")}
                                </p>
                                <Button
                                    variant="outline-ghost"
                                    size="sm"
                                    onClick={resetClockPosition}
                                >
                                    {t("resetPosition")}
                                </Button>
                            </>
                        )}
                    </div>
                </FormField>
            </FieldGroup>

            <FontSelector
                visible={showedPanel === "photoSelector"}
                onSelect={updateFont}
                onClose={() => setShowedPanel("none")}
                onOpen={handleSelectorOpen}
                fonts={fonts}
            />

            <PositionSelector
                visible={showedPanel === "positionSelector"}
                onConfirm={updatePosition}
                onClose={() => setShowedPanel("none")}
            />
        </div>
    );
};

export default ClockCustom;
