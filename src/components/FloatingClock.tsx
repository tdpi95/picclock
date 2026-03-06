import { useSettings } from "@/context/SettingsContext";
import { loadGoogleFont } from "@/lib/utils";
import { useEffect, useRef } from "react";

type Props = {
    moving?: boolean;
};

const SPEED = 80;
const PANEL_WIDTH = 260;
const PANEL_HEIGHT = 120;

export default function FloatingClock({ moving = true }: Props) {
    const { clockSettings } = useSettings();
    const containerRef = useRef<HTMLDivElement>(null);

    const hourRef = useRef<HTMLSpanElement>(null);
    const minuteRef = useRef<HTMLSpanElement>(null);
    const secondRef = useRef<HTMLSpanElement>(null);
    const ampmRef = useRef<HTMLSpanElement>(null);
    const dateRef = useRef<HTMLDivElement>(null);

    const velocity = useRef({ vx: 0, vy: 0 });
    const position = useRef({ x: 100, y: 100 });
    const lastTime = useRef(0);

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
        const maxX = window.innerWidth - PANEL_WIDTH - padding;
        const maxY = window.innerHeight - PANEL_HEIGHT - padding;

        return {
            x: Math.random() * maxX + padding,
            y: Math.random() * maxY + padding,
        };
    };

    const applyTransform = (x: number, y: number) => {
        if (containerRef.current) {
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

    // ---------- movement ----------
    useEffect(() => {
        updateTime();
        const timer = setInterval(updateTime, 1000);

        if (!moving) {
            return () => clearInterval(timer);
        }

        let panelWidth = PANEL_WIDTH;
        if (containerRef.current) {
            panelWidth = containerRef.current.offsetWidth;
        }

        let rafId: number;
        let intervalId: number | undefined;
        const movement = clockSettings.movement;
        const intervalMs = clockSettings.moveInterval;

        // STATIC
        if (movement === "static") {
            applyTransform(position.current.x, position.current.y);
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

                const maxX = window.innerWidth - panelWidth;
                const maxY = window.innerHeight - PANEL_HEIGHT - 8;

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
    }, [clockSettings, moving]);

    useEffect(() => {
        loadGoogleFont(clockSettings.font);
    }, [clockSettings.font]);

    return (
        <div ref={containerRef} className="fixed">
            <div
                className={`backdrop-blur-md bg-white/10 border border-white/20 shadow-lg rounded-2xl px-8 py-6 text-center text-white  flex flex-col justify-center`}
            >
                {/* Time */}
                <div
                    className="flex items-end justify-center gap-1 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]"
                    style={{
                        fontFamily: `'${clockSettings.font}', sans-serif`,
                    }}
                >
                    <span
                        ref={hourRef}
                        className="text-5xl font-semibold font-(${clockSettings.font})"
                    >
                        00
                    </span>
                    <span className="text-5xl">:</span>
                    <span ref={minuteRef} className="text-5xl font-semibold">
                        00
                    </span>
                    <div className="flex flex-col items-start leading-none ml-0 mb-0">
                        {!clockSettings._24h && (
                            <span
                                ref={ampmRef}
                                className="text-[10px] opacity-70"
                            >
                                AM
                            </span>
                        )}

                        <span ref={secondRef} className="text-sm">
                            00
                        </span>
                    </div>
                </div>

                {/* Date */}
                <div
                    ref={dateRef}
                    className="text-md mt-2 opacity-80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]"
                    style={{
                        fontFamily: `'${clockSettings.font}', sans-serif`,
                    }}
                >
                    Loading...
                </div>
            </div>
        </div>
    );
}
