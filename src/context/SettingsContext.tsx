import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface Position {
    x: number;
    y: number;
}

export type MovementType = "static" | "interval" | "continuous";
export type TransitionType = 
    | "fade" 
    | "slide" 
    | "slideVertical" 
    | "zoomOut" 
    | "blur" 
    | "kenBurns";

export interface ClockSettings {
    visible: boolean;
    _24h: boolean;
    movement: MovementType;
    moveInterval: number; // for interval mode
    position: Position; // for static mode
    color1: string;
    color2: string;
    font: string;
    fontSize: number;
    bgOpacity: number;
    bgBlur: boolean;
}

export interface GooglePhotosSettings {
    accessToken: string;
    tokenExpiry: number; // timestamp
    selectedPhotos: string[];
    selectedAlbums: string[];
    selectionMode: "photos" | "albums";
}

export interface ImmichSettings {
    instanceUrl: string;
    apiKey: string;
    selectedPhotos: string[];
    selectedAlbums: string[];
    selectionMode: "photos" | "albums";
}

export interface WallpaperSettings {
    imageSource: string;
    imageChangeInterval: number;
    uploadMode: "file" | "url";
    wakeLockDuration: number;
    transitionType: TransitionType;
    wallpaperPosition: "fill" | "fit";
    bing?: {
        lastFetch: number;
        imgUrl: string;
        title: string;
        desc: string;
    };
    googlePhotos?: GooglePhotosSettings;
}

export interface GeneralSettings {
    language: "en" | "vi";
}

interface SettingsContextType {
    wallpaperSettings: WallpaperSettings;
    updateWallpaperSettings: (newSettings: Partial<WallpaperSettings>) => void;
    clockSettings: ClockSettings;
    updateClockSettings: (newSettings: Partial<ClockSettings>) => void;
    immichSettings: ImmichSettings;
    updateImmichSettings: (newSettings: Partial<ImmichSettings>) => void;
    generalSettings: GeneralSettings;
    updateGeneralSettings: (newSettings: Partial<GeneralSettings>) => void;
    isInitialized: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
    undefined,
);

const defaultWallpaperSettings: WallpaperSettings = {
    imageSource: "picsum",
    imageChangeInterval: 300000, // 5 minutes
    uploadMode: "file",
    wakeLockDuration: -1, // disabled by default
    transitionType: "fade",
    wallpaperPosition: "fill",
};

const defaultClockSettings: ClockSettings = {
    visible: true,
    _24h: false,
    movement: "continuous",
    moveInterval: 10000,
    position: { x: 100, y: 100 },
    color1: "#ffffff",
    color2: "#000000",
    font: "Inter",
    fontSize: 10,
    bgOpacity: 20,
    bgBlur: true,
};

const defaultImmichSettings: ImmichSettings = {
    instanceUrl: "",
    apiKey: "",
    selectedPhotos: [],
    selectedAlbums: [],
    selectionMode: "albums",
};

const defaultGeneralSettings: GeneralSettings = {
    language: "en",
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [wallpaperSettings, setWallpaperSettings] =
        useState<WallpaperSettings>(defaultWallpaperSettings);
    const [clockSettings, setClockSettings] =
        useState<ClockSettings>(defaultClockSettings);
    const [immichSettings, setImmichSettings] = useState<ImmichSettings>(
        defaultImmichSettings,
    );
    const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(
        defaultGeneralSettings,
    );
    const [isInitialized, setInitialized] = useState(false);

    useEffect(() => {
        const storedWallpaper = localStorage.getItem("wallpaper");
        if (storedWallpaper) {
            console.log("Stored wallpaper settings:", storedWallpaper);
            try {
                const parsed = JSON.parse(storedWallpaper);
                setWallpaperSettings({
                    ...defaultWallpaperSettings,
                    ...parsed,
                });
            } catch (error) {
                console.error(
                    "Error parsing wallpaper settings from localStorage:",
                    error,
                );
            }
        } else {
            setWallpaperSettings({ ...defaultWallpaperSettings }); // create new object to trigger effect in Home
        }

        const storedClock = localStorage.getItem("clock");
        if (storedClock) {
            console.log("Stored clock settings:", storedClock);
            try {
                const parsed = JSON.parse(storedClock);
                setClockSettings({ ...defaultClockSettings, ...parsed });
            } catch (error) {
                console.error(
                    "Error parsing clock settings from localStorage:",
                    error,
                );
            }
        } else {
            setClockSettings({ ...defaultClockSettings });
        }

        const storedImmich = localStorage.getItem("immich");
        if (storedImmich) {
            try {
                const parsed = JSON.parse(storedImmich);
                setImmichSettings({ ...defaultImmichSettings, ...parsed });
            } catch (error) {
                console.error("Error parsing immich settings:", error);
            }
        }

        const storedGeneral = localStorage.getItem("general");
        if (storedGeneral) {
            try {
                const parsed = JSON.parse(storedGeneral);
                setGeneralSettings({ ...defaultGeneralSettings, ...parsed });
            } catch (error) {
                console.error("Error parsing general settings:", error);
            }
        }

        setInitialized(true);
    }, []);

    useEffect(() => {
        if (!isInitialized) return;

        const timeoutId = setTimeout(() => {
            console.log(
                "Save wallpaper settings to localStorage:",
                wallpaperSettings,
            );
            localStorage.setItem(
                "wallpaper",
                JSON.stringify(wallpaperSettings),
            );
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [wallpaperSettings, isInitialized]);

    useEffect(() => {
        if (!isInitialized) return;

        const timeoutId = setTimeout(() => {
            console.log("Save clock settings to localStorage:", clockSettings);
            localStorage.setItem("clock", JSON.stringify(clockSettings));
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [clockSettings, isInitialized]);

    useEffect(() => {
        if (!isInitialized) return;

        const timeoutId = setTimeout(() => {
            localStorage.setItem("immich", JSON.stringify(immichSettings));
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [immichSettings, isInitialized]);

    useEffect(() => {
        if (!isInitialized) return;

        const timeoutId = setTimeout(() => {
            localStorage.setItem("general", JSON.stringify(generalSettings));
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [generalSettings, isInitialized]);

    const updateWallpaperSettings = useCallback(
        (newSettings: Partial<WallpaperSettings>) => {
            setWallpaperSettings((prev) => ({ ...prev, ...newSettings }));
        },
        [],
    );

    const updateClockSettings = useCallback(
        (newSettings: Partial<ClockSettings>) => {
            setClockSettings((prev) => ({ ...prev, ...newSettings }));
        },
        [],
    );

    const updateImmichSettings = useCallback(
        (newSettings: Partial<ImmichSettings>) => {
            setImmichSettings((prev) => ({ ...prev, ...newSettings }));
        },
        [],
    );

    const updateGeneralSettings = useCallback(
        (newSettings: Partial<GeneralSettings>) => {
            setGeneralSettings((prev) => ({ ...prev, ...newSettings }));
        },
        [],
    );

    const contextValue = useMemo(
        () => ({
            wallpaperSettings,
            updateWallpaperSettings,
            clockSettings,
            updateClockSettings,
            immichSettings,
            updateImmichSettings,
            generalSettings,
            updateGeneralSettings,
            isInitialized,
        }),
        [
            wallpaperSettings,
            updateWallpaperSettings,
            clockSettings,
            updateClockSettings,
            immichSettings,
            updateImmichSettings,
            generalSettings,
            updateGeneralSettings,
            isInitialized,
        ],
    );

    return (
        <SettingsContext.Provider value={contextValue}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
};
