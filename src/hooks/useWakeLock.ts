import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/**
 *
 * @param initDuration in millis. -1: disable, 0: always on, >0: auto release after duration
 * @returns
 */
export const useWakeLock = (initDuration: number) => {
    const [isActive, setIsActive] = useState(false);
    const wakeLockRef = useRef<WakeLockSentinel>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [duration, setDuration] = useState(initDuration);
    const showedErrorRef = useRef(false);
    const lastRequestTimeRef = useRef<number>(0);

    const requestLock = useCallback(async () => {
        if (wakeLockRef.current !== null && !wakeLockRef.current.released) {
            releaseLock();
        }

        if (isNaN(duration) || duration < 0) {
            return;
        }

        if ("wakeLock" in navigator) {
            try {
                const sentinel = await navigator.wakeLock.request("screen");

                sentinel.addEventListener("release", () => {
                    setIsActive(false);
                    wakeLockRef.current = null;
                    console.log("Screen wake lock was released");
                    // toast.success("Screen wake lock was released", {
                    //     position: "bottom-left",
                    // });
                });

                wakeLockRef.current = sentinel;
                setIsActive(true);
                const msg =
                    "Screen wake lock is active for " + duration / 1000 + "s";
                console.log(msg);

                // toast.success(msg, { position: "bottom-left" });

                lastRequestTimeRef.current = Date.now();

            } catch (err: unknown) {
                if (err instanceof Error) {
                    console.error(`${err.name}, ${err.message}`);
                }
            }
        } else {
            console.error("Wake Lock API not supported in this browser");
            if (!showedErrorRef.current) {
                toast.error("Wake lock API is not supported in this browser", {
                    position: "bottom-left",
                });
                showedErrorRef.current = true;
            }
        }
    }, [duration]);

    const releaseLock = async () => {
        if (wakeLockRef.current) {
            try {
                await wakeLockRef.current.release();
            } catch (err: unknown) {
                if (err instanceof Error) {
                    toast.error(
                        `Error releasing wake lock: ${err.name}, ${err.message}`,
                    );
                }
                console.error("Error releasing wake lock:", err);
            }
        }
    };

    const startTimer = useCallback(() => {
        if (duration <= 0) return; // don't start timer if always on or disabled

        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
            releaseLock();
        }, duration);
    }, [duration]);

    useEffect(() => {
        if (isNaN(duration) || duration < 0) return;

        const handleVisibilityChange = async () => {
            if (
                wakeLockRef.current !== null &&
                document.visibilityState === "visible"
            ) {
                await requestLock();
                startTimer();
            }
        };

        const handleClick = async () => {
            if (Date.now() - lastRequestTimeRef.current > 30000) {
                await requestLock();
            }

            startTimer();
        };

        requestLock();

        addEventListener("click", handleClick);
        addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            removeEventListener("visibilitychange", handleVisibilityChange);
            removeEventListener("click", handleClick);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [duration]);

    const changeDuration = (dur: number) => {
        setDuration(dur);
    };

    return { isActive, requestLock, releaseLock, changeDuration };
};
