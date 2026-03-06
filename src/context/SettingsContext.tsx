import { createContext, useContext, useEffect, useState } from "react";

interface Position {
    x: number;
    y: number;
}

export type MovementType = "static" | "interval" | "continuous";

export interface ClockSettings {
    visible: boolean;
    _24h: boolean;
    movement: MovementType;
    moveInterval: number; // for interval mode
    position: Position; // for static mode
    color1: string;
    color2: string;
    font: string;
    bgOpacity: number;
    bgBlur: boolean;
}

export interface WallpaperSettings {
    imageSource: string;
    imageChangeInterval: number;
    uploadMode: "file" | "url";
    wakeLockDuration: number;
    bing?: {
        lastFetch: Date;
        imgUrl: string;
        title: string;
        desc: string;
    };
}

// interface Settings {
//     wallpaper: WallpaperSettings;
//     clock: ClockSettings;
// }

interface SettingsContextType {
    wallpaperSettings: WallpaperSettings;
    updateWallpaperSettings: (newSettings: Partial<WallpaperSettings>) => void;
    clockSettings: ClockSettings;
    updateClockSettings: (newSettings: Partial<ClockSettings>) => void;
    // updateSettings: (newSettings: Partial<Settings>) => void;
    isInitialized: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
    undefined,
);

// const defaultSettings: Settings = {
//     wallpaper: {
//         imageSource: "picsum",
//         imageChangeInterval: 300000, // 5 minutes
//         uploadMode: "file",
//         wakeLockDuration: -1, // disabled by default
//     },
//     clock: {
//         visible: true,
//         _24h: false,
//         movement: "continuous",
//         moveInterval: 10000,
//         position: { x: 100, y: 100 },
//         color1: "#ffffff",
//         color2: "#000000",
//         font: "Inter",
//         bgOpacity: 20,
//         bgBlur: true,
//     },
// };

const defaultWallpaperSettings: WallpaperSettings = {
    imageSource: "picsum",
    imageChangeInterval: 300000, // 5 minutes
    uploadMode: "file",
    wakeLockDuration: -1, // disabled by default
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
    bgOpacity: 20,
    bgBlur: true,
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [wallpaperSettings, setWallpaperSettings] =
        useState<WallpaperSettings>(defaultWallpaperSettings);
    const [clockSettings, setClockSettings] =
        useState<ClockSettings>(defaultClockSettings);
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

        setInitialized(true);
    }, []);

    useEffect(() => {
        if (!isInitialized) return;

        console.log(
            "Save wallpaper settings to localStorage:",
            wallpaperSettings,
        );
        localStorage.setItem("wallpaper", JSON.stringify(wallpaperSettings));
    }, [wallpaperSettings, isInitialized]);

    useEffect(() => {
        if (!isInitialized) return;

        console.log("Save clock settings to localStorage:", clockSettings);
        localStorage.setItem("clock", JSON.stringify(clockSettings));
    }, [clockSettings, isInitialized]);

    const updateWallpaperSettings = (
        newSettings: Partial<WallpaperSettings>,
    ) => {
        setWallpaperSettings((prev) => ({ ...prev, ...newSettings }));
    };

    const updateClockSettings = (newSettings: Partial<ClockSettings>) => {
        setClockSettings((prev) => ({ ...prev, ...newSettings }));
    };

    return (
        <SettingsContext.Provider
            value={{
                wallpaperSettings,
                updateWallpaperSettings,
                clockSettings,
                updateClockSettings,
                isInitialized,
            }}
        >
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
