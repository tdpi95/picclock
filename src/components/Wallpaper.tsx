import { useState, useEffect, forwardRef, useCallback, useMemo } from "react";
import { useSettings } from "@/context/SettingsContext";
import { useImageStore } from "@/hooks/useImageStore";
import { createProvider } from "@/lib/providers";

interface WallpaperProps {
    onLoad?: () => void;
}

const Wallpaper = forwardRef<HTMLDivElement, WallpaperProps>(({ onLoad }, ref) => {
    const { wallpaperSettings, updateWallpaperSettings, isInitialized } = useSettings();
    const photoStore = useImageStore("photos");

    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [prevImage, setPrevImage] = useState<string | null>(null);
    const [loadingImage, setLoadingImage] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    const providerContext = useMemo(() => ({
        settings: wallpaperSettings,
        updateWallpaperSettings,
        store: photoStore
    }), [wallpaperSettings, updateWallpaperSettings, photoStore]);

    const provider = useMemo(() => 
        createProvider(wallpaperSettings.imageSource, providerContext),
    [wallpaperSettings.imageSource, providerContext]);

    const handleNext = useCallback(() => {
        if (!provider) return;
        provider.next().then((url) => {
            if (url) setLoadingImage(url);
        });
    }, [provider]);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        if (showInfo) {
            timeout = setTimeout(() => setShowInfo(false), 5000);
        }
        return () => clearTimeout(timeout);
    }, [showInfo]);

    const handleInteraction = useCallback(() => {
        if (wallpaperSettings.imageSource === "bing") {
            setShowInfo(true);
        }
    }, [wallpaperSettings.imageSource]);

    useEffect(() => {
        if (!isInitialized) return;
        handleNext();
    }, [provider, isInitialized, handleNext]);

    useEffect(() => {
        if (!isInitialized) return;

        let refreshMillis = 0;
        switch (wallpaperSettings.imageSource) {
            case "bing":
                refreshMillis = 60 * 60 * 1000; // 1 hour
                break;
            default:
                refreshMillis = wallpaperSettings.imageChangeInterval;
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
        
        setTimeout(() => {
            setIsTransitioning(false);
            setPrevImage(null);
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
        <div 
            ref={ref} 
            className="absolute inset-0 overflow-hidden"
            onClick={handleInteraction}
        >
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

            {/* Bing info box */}
            {wallpaperSettings.imageSource === "bing" && wallpaperSettings.bing && (
                <div className={`absolute top-6 left-6 max-w-sm transition-opacity duration-500 ${showInfo ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                    <div className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        <h3 className="text-lg font-semibold leading-tight mb-1">
                            {wallpaperSettings.bing.title}
                        </h3>
                        <p className="text-xs text-white/90 line-clamp-2">
                            {wallpaperSettings.bing.desc}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
});

Wallpaper.displayName = "Wallpaper";

export default Wallpaper;
