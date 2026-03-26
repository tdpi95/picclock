import { useSettings } from "@/context/SettingsContext";
import { loadGoogleFont } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type Props = {
    moving?: boolean;
};

const SPEED = 80;
const PANEL_WIDTH = 260;
const PANEL_HEIGHT = 120;

export default function FloatingClock({ moving = true }: Props) {
    const { clockSettings, updateClockSettings } = useSettings();
    const containerRef = useRef<HTMLDivElement>(null);

    const hourRef = useRef<HTMLSpanElement>(null);
    const minuteRef = useRef<HTMLSpanElement>(null);
    const secondRef = useRef<HTMLSpanElement>(null);
    const ampmRef = useRef<HTMLSpanElement>(null);
    const dateRef = useRef<HTMLDivElement>(null);

    const velocity = useRef({ vx: 0, vy: 0 });
    const position = useRef({ x: 100, y: 100 });
    const lastTime = useRef(0);

    const [isDragging, setIsDragging] = useState(false);
    const [shaking, setShaking] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    // ---------- shaking ----------
    useEffect(() => {
        const handleShake = () => {
            setShaking(true);
            setTimeout(() => setShaking(false), 500);
        };
        window.addEventListener("clock-shake", handleShake);
        return () => window.removeEventListener("clock-shake", handleShake);
    }, []);

    // ---------- helpers ----------
    const normalizeVelocity = () => {
        const mag = Math.sqrt(
            velocity.current.vx ** 2 + velocity.current.vy ** 2,
        );
        velocity.current.vx = (velocity.current.vx / mag) * SPEED;
        velocity.current.vy = (velocity.current.vy / mag) * SPEED;
    };

    const getRandomPosition = () => {
        const padding = 20;
        const maxX = window.innerWidth - (containerRef.current?.offsetWidth || PANEL_WIDTH) - padding;
        const maxY = window.innerHeight - (containerRef.current?.offsetHeight || PANEL_HEIGHT) - padding;

        return {
            x: Math.random() * maxX + padding,
            y: Math.random() * maxY + padding,
        };
    };

    const applyTransform = (x: number, y: number) => {
        if (containerRef.current && !isDragging) {
            containerRef.current.style.transform = `translate(${x}px, ${y}px)`;
        }
    };

    const updateTime = () => {
        const now = new Date();

        const h = now.getHours();
        const m = now.getMinutes();
        const s = now.getSeconds();

        const hours = clockSettings._24h
            ? String(h).padStart(2, "0")
            : String(h % 12 || 12).padStart(2, "0");
        const minutes = String(m).padStart(2, "0");
        const seconds = String(s).padStart(2, "0");
        const ampm = h >= 12 ? "PM" : "AM";

        if (hourRef.current) hourRef.current.textContent = hours;
        if (minuteRef.current) minuteRef.current.textContent = minutes;
        if (secondRef.current) secondRef.current.textContent = seconds;
        if (ampmRef.current) ampmRef.current.textContent = ampm;

        if (dateRef.current) {
            dateRef.current.textContent = now.toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        }
    };

    const getDistance = (
        a: { x: number; y: number },
        b: { x: number; y: number },
    ) => {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // ---------- dragging ----------
    const onMouseDown = (e: React.MouseEvent) => {
        if (clockSettings.movement !== "static") return;
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
        setIsDragging(true);
    };

    useEffect(() => {
        if (!isDragging) return;

        const onMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            
            const x = e.clientX - dragOffset.current.x;
            const y = e.clientY - dragOffset.current.y;
            
            containerRef.current.style.transform = `translate(${x}px, ${y}px)`;
        };

        const onMouseUp = (e: MouseEvent) => {
            setIsDragging(false);
            
            // Calculate pixel position
            const x = e.clientX - dragOffset.current.x;
            const y = e.clientY - dragOffset.current.y;
            
            updateClockSettings({
                position: { x, y }
            });
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, [isDragging, updateClockSettings]);

    // ---------- movement ----------
    useEffect(() => {
        updateTime();
        const timer = setInterval(updateTime, 1000);

        if (!moving || isDragging) {
            return () => clearInterval(timer);
        }

        let panelWidth = containerRef.current?.offsetWidth || PANEL_WIDTH;
        let panelHeight = containerRef.current?.offsetHeight || PANEL_HEIGHT;

        let rafId: number;
        let intervalId: number | undefined;
        const movement = clockSettings.movement;
        const intervalMs = clockSettings.moveInterval;

        // STATIC
        if (movement === "static") {
            applyTransform(clockSettings.position.x, clockSettings.position.y);
        }

        // INTERVAL JUMP
        if (movement === "interval") {
            const move = () => {
                const current = position.current;
                const next = getRandomPosition();

                const distance = getDistance(current, next);
                const duration = distance / 120; // seconds

                position.current = next;

                if (containerRef.current) {
                    containerRef.current.style.transition = `transform ${duration}s ease-in-out`;
                }

                applyTransform(next.x, next.y);
            };

            move();
            intervalId = setInterval(move, intervalMs);
        }

        // CONTINUOUS (DVD bounce)
        if (movement === "continuous") {
            if (containerRef.current) {
                containerRef.current.style.transition = "none";
            }

            velocity.current = {
                vx: Math.random() * 2 - 1,
                vy: Math.random() * 2 - 1,
            };
            normalizeVelocity();

            lastTime.current = performance.now();

            const animate = (now: number) => {
                const dt = (now - lastTime.current) / 1000;
                lastTime.current = now;

                let { x, y } = position.current;

                x += velocity.current.vx * dt;
                y += velocity.current.vy * dt;

                const maxX = window.innerWidth - (containerRef.current?.offsetWidth || panelWidth);
                const maxY = window.innerHeight - (containerRef.current?.offsetHeight || panelHeight);

                if (x <= 0 || x >= maxX) {
                    velocity.current.vx *= -1;
                    x = Math.max(0, Math.min(x, maxX));
                }

                if (y <= 0 || y >= maxY) {
                    velocity.current.vy *= -1;
                    y = Math.max(0, Math.min(y, maxY));
                }

                position.current = { x, y };
                applyTransform(x, y);

                rafId = requestAnimationFrame(animate);
            };

            rafId = requestAnimationFrame(animate);
        }

        return () => {
            clearInterval(timer);
            if (intervalId) clearInterval(intervalId);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [clockSettings, moving, isDragging]);

    useEffect(() => {
        loadGoogleFont(clockSettings.font);
    }, [clockSettings.font]);

    const textSize = 20 * Math.pow(1.15, clockSettings.fontSize - 1);

    return (
        <div 
            ref={containerRef} 
            className="fixed select-none"
            onMouseDown={onMouseDown}
            style={{
                cursor: clockSettings.movement === "static" ? (isDragging ? "grabbing" : "grab") : "default",
                zIndex: isDragging ? 100 : 10
            }}
        >
            <style>{`
                @keyframes shake {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-1deg); }
                    20% { transform: translate(-3px, 0px) rotate(1deg); }
                    30% { transform: translate(3px, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    70% { transform: translate(3px, 1px) rotate(-1deg); }
                    80% { transform: translate(-1px, -1px) rotate(1deg); }
                    90% { transform: translate(1px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                }
                .animate-shake {
                    animation: shake 0.5s;
                }
            `}</style>
            <div
                className={`backdrop-blur-md bg-white/10 border border-white/20 shadow-lg rounded-2xl px-8 pt-3 pb-6 text-center text-white  flex flex-col justify-center transition-transform ${isDragging ? "scale-105" : "scale-100"} ${shaking ? "animate-shake" : ""}`}
            >
                {/* Time */}
                <div
                    className="flex items-baseline justify-center gap-1 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]"
                    style={{
                        fontFamily: `'${clockSettings.font}', sans-serif`,
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    <span
                        ref={hourRef}
                        className="font-semibold inline-block text-right"
                        style={{ 
                            fontSize: `${textSize}px`,
                            minWidth: "1em"
                        }}
                    >
                        00
                    </span>
                    <span
                        style={{ fontSize: `${textSize}px` }}
                    >
                        :
                    </span>
                    <span
                        ref={minuteRef}
                        className="inline-block text-left"
                        style={{ 
                            fontSize: `${textSize}px`,
                            minWidth: "1em"
                        }}
                    >
                        00
                    </span>
                    <div className="relative ml-0 flex items-baseline">
                        {!clockSettings._24h && (
                            <span
                                ref={ampmRef}
                                className="absolute bottom-[100%] left-0 opacity-70 leading-none"
                                style={{
                                    fontSize: `${textSize * 0.3}px`
                                }}
                            >
                                AM
                            </span>
                        )}

                        <span
                            ref={secondRef}
                            className="inline-block"
                            style={{
                                fontSize: `${textSize * 0.3}px`,
                                minWidth: "2ch"
                            }}
                        >
                            00
                        </span>
                    </div>
                </div>

                {/* Date */}
                <div
                    ref={dateRef}
                    className="opacity-80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]"
                    style={{
                        fontFamily: `'${clockSettings.font}', sans-serif`,
                        fontSize: `${textSize * 0.3}px`,
                    }}
                >
                    Loading...
                </div>
            </div>
        </div>
    );
}
