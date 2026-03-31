import { useSettings } from "@/context/SettingsContext";
import { useEffect, useRef, useState } from "react";
import { LuFullscreen, LuSettings, LuDownload } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { useWakeLock } from "@/hooks/useWakeLock";
import { Toaster } from "@/components/ui/sonner";
import FloatingClock from "@/components/FloatingClock";
import MainSettings from "./MainSettings";
import Wallpaper, { type WallpaperHandle } from "@/components/Wallpaper";

function Home() {
    const { wallpaperSettings, clockSettings, isInitialized } = useSettings();
    const [showSettings, setShowSettings] = useState(false);
    const { changeDuration: changeWakeLockDuration } = useWakeLock(-1);

    const imgRef = useRef<WallpaperHandle | null>(null);

    useEffect(() => {
        if (isInitialized) {
            changeWakeLockDuration(wallpaperSettings.wakeLockDuration);
        }
    }, [
        changeWakeLockDuration,
        isInitialized,
        wallpaperSettings.wakeLockDuration,
    ]);

    const handleScreenClick = (e: React.MouseEvent) => {
        if (clockSettings.movement !== "static") return;
        if (showSettings) return;

        // Skip if clicking on interactive elements
        if (
            (e.target as HTMLElement).closest("button") ||
            (e.target as HTMLElement).closest("footer")
        ) {
            return;
        }

        window.dispatchEvent(new CustomEvent("clock-wobble"));
    };


    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(
                    "Error attempting to enable fullscreen mode:",
                    err,
                );
            });
        } else {
            document.exitFullscreen();
        }
    };

    const handleDownload = () => {
        imgRef.current?.downloadImage();
    };

    return (
        <div 
            className="relative min-h-screen w-full bg-linear-to-r from-blue-500 to-teal-800"
            onClick={handleScreenClick}
        >
            <Wallpaper ref={imgRef} />

            {clockSettings.visible && <FloatingClock moving={!showSettings} />}

            {showSettings && (
                <MainSettings onBack={() => setShowSettings(false)} />
            )}

            <Toaster position="top-right" />

            <Footer
                triggerElementRef={imgRef as any}
                leftElement={
                    <Button
                        size="lg"
                        variant="ghost"
                        onClick={handleDownload}
                        title="Download Wallpaper"
                    >
                        <LuDownload size={30} />
                    </Button>
                }
                rightElement={
                    <div className="flex gap-2">
                        <Button
                            size="lg"
                            variant="ghost"
                            onClick={() => setShowSettings((v) => !v)}
                        >
                            <LuSettings size={30} />
                        </Button>
                        <Button
                            size="lg"
                            variant="ghost"
                            onClick={toggleFullscreen}
                        >
                            <LuFullscreen size={30} />
                        </Button>
                    </div>
                }
            />
        </div>
    );
}

export default Home;
