import React, { useState } from "react";
import LocalPhotoSelector from "../components/PhotoSelector/LocalPhotoSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WallpaperSettings from "./WallpaperSettings";
import ClockCustom from "./ClockCustom";
import { Dialog } from "@/components/Dialog";

type PanelType = "main" | "photoSelector" | "clockSettings";

const MainSettings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [showedPanel, setShowedPanel] = useState<PanelType>("main");

    return (
        <>
            <Dialog
                visible={showedPanel === "main"}
                onClose={() => onBack()}
                header="Settings"
            >
                <Tabs defaultValue="wallpaper" className="w-full">
                    <TabsList className="w-full bg-white/30">
                        <TabsTrigger value="wallpaper">Photos</TabsTrigger>
                        <TabsTrigger value="clock">Clock</TabsTrigger>
                    </TabsList>
                    {/* use fixed height "h-[50vh]" if content is too long */}
                    <div className="min-h-[40vh] max-h-[60vh] overflow-y-auto">
                        <TabsContent value="wallpaper">
                            <WallpaperSettings />
                        </TabsContent>
                        <TabsContent value="clock">
                            <ClockCustom />
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
