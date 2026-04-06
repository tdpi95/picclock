import { useState, useEffect, forwardRef, useCallback, useMemo, useImperativeHandle, useRef } from "react";
import { useSettings } from "@/context/SettingsContext";
import { useImageStore } from "@/hooks/useImageStore";
import { createProvider } from "@/lib/providers";

interface WallpaperProps {
    onLoad?: () => void;
}

interface WallpaperProps {
    onLoad?: () => void;
}

export interface WallpaperHandle extends HTMLDivElement {
    downloadImage: () => void;
}

const Wallpaper = forwardRef<WallpaperHandle, WallpaperProps>(({ onLoad }, ref) => {
    const { 
        wallpaperSettings, 
        updateWallpaperSettings, 
        immichSettings,
        updateImmichSettings,
        isInitialized 
    } = useSettings();
    const photoStore = useImageStore("photos");

    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [prevImage, setPrevImage] = useState<string | null>(null);
    const [loadingImage, setLoadingImage] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    const providerContext = useMemo(() => ({
        settings: wallpaperSettings,
        updateWallpaperSettings,
        immichSettings,
        updateImmichSettings,
        store: photoStore
    }), [wallpaperSettings, updateWallpaperSettings, immichSettings, updateImmichSettings, photoStore]);

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
        const refresh = () => handleNext();
        window.addEventListener("wallpaper-refresh", refresh);
        return () => window.removeEventListener("wallpaper-refresh", refresh);
    }, [handleNext]);

    useEffect(() => {
        if (!isInitialized) return;

        let refreshMillis = 0;
        switch (wallpaperSettings.imageSource) {
            case "bing":
                refreshMillis = 30 * 60 * 1000; // 30 minutes
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

    const divRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => {
        const div = divRef.current;
        if (!div) return {} as any;

        return Object.assign(div, {
            downloadImage: async () => {
                const img = div.querySelector('img[data-active="true"]') as HTMLImageElement;
                if (!img || !img.src) {
                    console.error("No current image found to download");
                    return;
                }

                try {
                    const response = await fetch(img.src);
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    
                    const link = document.createElement("a");
                    const timestamp = new Date().getTime();
                    link.download = `wallpaper-${timestamp}.jpg`;
                    link.href = url;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    URL.revokeObjectURL(url);
                } catch (err) {
                    console.error("Failed to download image via fetch (likely CORS):", err);
                    // fallback
                    const link = document.createElement("a");
                    link.href = img.src;
                    const timestamp = new Date().getTime();
                    link.download = `wallpaper-${timestamp}.jpg`;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
        }) as any;
    }, []);

    const isFit = wallpaperSettings.wallpaperPosition === "fit";
    const objectClass = isFit ? "object-contain" : "object-cover";

    return (
        <div 
            ref={divRef}
            className="absolute inset-0 overflow-hidden bg-black"
            onClick={handleInteraction}
        >
            {/* blur layer for fit mode */}
            {isFit && prevImage && (
                <div className={`absolute inset-0 pointer-events-none ${isTransitioning ? getOutAnimation() : "hidden"}`}>
                    <img
                        key={`prev-blur-${prevImage}`}
                        src={prevImage}
                        crossOrigin="anonymous"
                        className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-50 scale-110"
                        alt=""
                    />
                </div>
            )}
            {isFit && currentImage && (
                <div className={`absolute inset-0 pointer-events-none ${isTransitioning ? getInAnimation() : ""}`}>
                    <img
                        key={`curr-blur-${currentImage}`}
                        src={currentImage}
                        crossOrigin="anonymous"
                        className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-50 scale-110"
                        alt=""
                    />
                </div>
            )}

            {/* main wallpaper layer */}
            {prevImage && (
                <img
                    key={`prev-${prevImage}`}
                    src={prevImage}
                    crossOrigin="anonymous"
                    className={`absolute inset-0 h-full w-full ${objectClass} pointer-events-none ${isTransitioning ? getOutAnimation() : "hidden"}`}
                    alt=""
                />
            )}
            {currentImage && (
                <img
                    key={`curr-${currentImage}`}
                    src={currentImage}
                    data-active="true"
                    crossOrigin="anonymous"
                    className={`absolute inset-0 h-full w-full ${objectClass} ${isTransitioning ? getInAnimation() : ""}`}
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
