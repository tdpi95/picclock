import React, { useState } from "react";
import LocalPhotoSelector from "../components/PhotoSelector/LocalPhotoSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WallpaperSettings from "./WallpaperSettings";
import ClockCustom from "./ClockCustom";
import { Dialog } from "@/components/Dialog";
import GeneralSettings from "./GeneralSettings";
import { useTranslation } from "@/lib/translations";

type PanelType = "main" | "photoSelector" | "clockSettings";

const MainSettings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [showedPanel, setShowedPanel] = useState<PanelType>("main");
    const { t } = useTranslation();

    return (
        <>
            <Dialog
                visible={showedPanel === "main"}
                onClose={() => onBack()}
                header={t("settings")}
            >
                <Tabs defaultValue="wallpaper" className="w-full">
                    <TabsList className="w-full bg-white/30">
                        <TabsTrigger value="wallpaper">{t("photos")}</TabsTrigger>
                        <TabsTrigger value="clock">{t("clock")}</TabsTrigger>
                        <TabsTrigger value="general">{t("other")}</TabsTrigger>
                    </TabsList>
                    {/* use fixed height "h-[50vh]" if content is too long */}
                    <div className="min-h-[40vh] max-h-[60vh] overflow-y-auto">
                        <TabsContent value="wallpaper">
                            <WallpaperSettings />
                        </TabsContent>
                        <TabsContent value="clock">
                            <ClockCustom />
                        </TabsContent>
                        <TabsContent value="general">
                            <GeneralSettings />
                        </TabsContent>
                    </div>
                </Tabs>
            </Dialog>

            {showedPanel === "photoSelector" && (
                <LocalPhotoSelector onClose={() => setShowedPanel("main")} />
            )}
        </>
    );
};

export default MainSettings;
