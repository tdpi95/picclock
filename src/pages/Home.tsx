import { useSettings } from "@/context/SettingsContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { LuFullscreen, LuSettings } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useImageStore } from "@/hooks/useImageStore";
import Footer from "@/components/Footer";
import { useWakeLock } from "@/hooks/useWakeLock";
import { Toaster } from "sonner";
import FloatingClock from "@/components/FloatingClock";
import MainSettings from "./MainSettings";

const proxy = "https://whateverorigin.org/get?url=";
const bingUrl = encodeURIComponent(
    "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US",
);

const getPicsumImageUrl = () => {
    const timestamp = Date.now();
    console.log("Get new Picsum image");
    return `https://picsum.photos/1920/1080?random=${timestamp}`;
};

const getBingImageUrl = async () => {
    try {
        const bUrl = `${proxy}${bingUrl}`;
        console.log("Fetching Bing image from: ", bUrl);
        const response = await fetch(bUrl);
        const data = await response.json();
        const contents = JSON.parse(data.contents);
        const imageUrl = contents.images[0].url;
        return `https://www.bing.com${imageUrl}`;
    } catch (error) {
        console.error("Error fetching Bing image:", error);
        return "";
    }
};

function Home() {
    const { wallpaperSettings, clockSettings, isInitialized } = useSettings();
    const [showSettings, setShowSettings] = useState(false);
    const { changeDuration: changeWakeLockDuration } = useWakeLock(-1);

    const imgRef = useRef<HTMLImageElement | null>(null);

    const photoStore = useImageStore("photos");
    const [photoKeys, setPhotoKeys] = useState<string[]>([]);

    const [currentUrl, setCurrentUrl] = useState<string | null>(null);
    const [prevUrl, setPrevUrl] = useState<string | null>(null);
    const [pendingUrl, setPendingUrl] = useState<string | null>(null);
    const [listIdx, setListIdx] = useState(0);

    const getNextUrl = useCallback(async () => {
        if (wallpaperSettings.imageSource === "local") {
            if (photoKeys.length === 0) return null;

            const nextIdx = (listIdx + 1) % photoKeys.length;
            const url = await photoStore.getOriginalURL(photoKeys[nextIdx]);
            setListIdx(nextIdx);
            console.log("Loading local image:", url);
            return url;
        } else if (wallpaperSettings.imageSource === "picsum") {
            return getPicsumImageUrl();
        } else if (wallpaperSettings.imageSource === "bing") {
            return getBingImageUrl();
        }
        return null;
    }, [wallpaperSettings.imageSource, photoKeys, listIdx, photoStore]);

    const handleNext = useCallback(() => {
        getNextUrl().then((url) => {
            setPendingUrl(url);
        });
    }, [getNextUrl]);

    const onImageReady = () => {
        setPrevUrl(currentUrl);
        setCurrentUrl(pendingUrl);
        setPendingUrl(null);
    };

    useEffect(() => {
        if (isInitialized) {
            changeWakeLockDuration(wallpaperSettings.wakeLockDuration);
        }
    }, [
        changeWakeLockDuration,
        isInitialized,
        wallpaperSettings.wakeLockDuration,
    ]);

    useEffect(() => {
        if (!isInitialized) return;

        let refreshMillis = 0;
        switch (wallpaperSettings.imageSource) {
            case "picsum":
            case "local":
                refreshMillis = wallpaperSettings.imageChangeInterval;
                break;
            case "bing":
                refreshMillis = 60 * 60 * 1000; // 1 hour
                break;
        }

        if (refreshMillis <= 0) return;

        const interval = setInterval(handleNext, refreshMillis);

        return () => clearInterval(interval);
    }, [wallpaperSettings, handleNext]);

    useEffect(() => {
        console.log("image source changed:", wallpaperSettings.imageSource);
        const loadPhotoKeys = async () => {
            const keys = await photoStore.getAllKeys();
            setPhotoKeys(keys);
        };

        if (isInitialized) {
            if (wallpaperSettings.imageSource === "local") {
                loadPhotoKeys();
            } else {
                handleNext();
            }
        }
        // dependency should be whole settings instead of just imageSource,
        // otherwise if image source is the same as default, the effect won't run and no image will be loaded
    }, [wallpaperSettings, photoStore]);

    useEffect(() => {
        if (photoKeys.length > 0) {
            handleNext();
        }
    }, [photoKeys]);

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

    return (
        <div className="relative min-h-screen w-full bg-linear-to-r from-blue-500 to-teal-800">
            {prevUrl && (
                <img
                    src={prevUrl}
                    className="absolute inset-0 h-full w-full object-cover animate-fade-in"
                />
            )}

            {currentUrl && (
                <img
                    key={currentUrl}
                    src={currentUrl}
                    className="absolute inset-0 h-full w-full object-cover animate-fade-in"
                    ref={imgRef}
                />
            )}

            {pendingUrl && (
                <img
                    src={pendingUrl}
                    onLoad={onImageReady}
                    className="hidden"
                    alt=""
                />
            )}

            {clockSettings.visible && <FloatingClock moving={!showSettings} />}

            {showSettings && (
                <MainSettings onBack={() => setShowSettings(false)} />
            )}

            <Toaster />

            <Footer
                triggerElementRef={imgRef}
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
