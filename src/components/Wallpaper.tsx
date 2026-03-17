import { useState, useEffect, forwardRef, useCallback } from "react";
import { useSettings } from "@/context/SettingsContext";
import { useImageStore } from "@/hooks/useImageStore";

interface WallpaperProps {
    onLoad?: () => void;
}

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

const Wallpaper = forwardRef<HTMLDivElement, WallpaperProps>(({ onLoad }, ref) => {
    const { wallpaperSettings, isInitialized } = useSettings();
    const photoStore = useImageStore("photos");
    const [photoKeys, setPhotoKeys] = useState<string[]>([]);
    const [listIdx, setListIdx] = useState(0);

    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [prevImage, setPrevImage] = useState<string | null>(null);
    const [loadingImage, setLoadingImage] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

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
            if (url) setLoadingImage(url);
        });
    }, [getNextUrl]);

    useEffect(() => {
        if (!isInitialized) return;

        const loadPhotoKeys = async () => {
            const keys = await photoStore.getAllKeys();
            setPhotoKeys(keys);
        };

        if (wallpaperSettings.imageSource === "local") {
            loadPhotoKeys();
        } else {
            handleNext();
        }
    }, [wallpaperSettings.imageSource, isInitialized, photoStore, handleNext]);

    useEffect(() => {
        if (photoKeys.length > 0) {
            handleNext();
        }
    }, [photoKeys]);

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
    }, [wallpaperSettings.imageSource, wallpaperSettings.imageChangeInterval, isInitialized, handleNext]);


    const handleLoad = () => {
        setPrevImage(currentImage);
        setCurrentImage(loadingImage);
        setLoadingImage(null);
        setIsTransitioning(true);
        onLoad?.();
        
        // Reset transitioning state after animation completes
        setTimeout(() => {
            setIsTransitioning(false);
            setPrevImage(null); // Clear previous image after transition
        }, 1500);
    };

    const getInAnimation = () => {
        switch (wallpaperSettings.transitionType) {
            case "slide": return "animate-slide-in-right";
            case "zoom": return "animate-zoom-in";
            default: return "animate-fade-in";
        }
    };

    const getOutAnimation = () => {
        switch (wallpaperSettings.transitionType) {
            case "slide": return "animate-slide-out-left";
            default: return "animate-fade-out";
        }
    };

    return (
        <div ref={ref} className="absolute inset-0 overflow-hidden">
            {prevImage && (
                <img
                    key={`prev-${prevImage}`}
                    src={prevImage}
                    className={`absolute inset-0 h-full w-full object-cover pointer-events-none ${isTransitioning ? getOutAnimation() : "hidden"}`}
                    alt=""
                />
            )}
            {currentImage && (
                <img
                    key={`curr-${currentImage}`}
                    src={currentImage}
                    className={`absolute inset-0 h-full w-full object-cover ${isTransitioning ? getInAnimation() : ""}`}
                    alt=""
                />
            )}
            {loadingImage && (
                <img
                    src={loadingImage}
                    className="hidden"
                    onLoad={handleLoad}
                    alt=""
                />
            )}
        </div>
    );
});

Wallpaper.displayName = "Wallpaper";

export default Wallpaper;
