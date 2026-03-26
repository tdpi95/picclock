import { useState, useRef, useEffect } from "react";
import { Dialog } from "./Dialog";
import { Button } from "./ui/button";
import { useSettings } from "@/context/SettingsContext";

interface Position {
    x: number; // 0 to 100
    y: number; // 0 to 100
}

interface Props {
    visible: boolean;
    onConfirm: (pos: Position) => void;
    onClose?: () => void;
}

const formatTime = (use12h: boolean): string => {
    const now = new Date();

    let hours = now.getHours();
    const minutes = now.getMinutes();

    if (use12h) {
        hours = hours % 12 || 12;
    }

    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");

    return `${hh}:${mm}`;
};

const PositionSelector = ({ visible, onConfirm, onClose }: Props) => {
    const { clockSettings } = useSettings();
    const [position, setPosition] = useState<Position>(clockSettings.position);
    const [isDragging, setIsDragging] = useState(false);
    const [isSnapped, setIsSnapped] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const [aspectRatio, setAspectRatio] = useState(
        window.innerWidth / window.innerHeight,
    );

    useEffect(() => {
        const updateRatio = () => {
            setAspectRatio(window.innerWidth / window.innerHeight);
        };
        window.addEventListener("resize", updateRatio);
        return () => window.removeEventListener("resize", updateRatio);
    }, []);

    const SNAP_THRESHOLD = 5; // Sensitivity of the "magnet"

    const time = formatTime(clockSettings._24h);

    const applySnapping = (
        val: number,
    ): { value: number; snapped: boolean } => {
        if (val < SNAP_THRESHOLD) return { value: 0, snapped: true };
        if (val > 100 - SNAP_THRESHOLD) return { value: 100, snapped: true };
        if (Math.abs(val - 50) < SNAP_THRESHOLD)
            return { value: 50, snapped: true };
        return { value: Math.round(val), snapped: false };
    };

    const updatePosition = (clientX: number, clientY: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        const rawPctX = ((clientX - rect.left) / rect.width) * 100;
        const rawPctY = ((clientY - rect.top) / rect.height) * 100;

        const snapX = applySnapping(Math.max(0, Math.min(100, rawPctX)));
        const snapY = applySnapping(Math.max(0, Math.min(100, rawPctY)));

        setIsSnapped(snapX.snapped || snapY.snapped);
        
        // Convert snapped percentage back to window pixels
        const pixelX = (snapX.value / 100) * window.innerWidth;
        const pixelY = (snapY.value / 100) * window.innerHeight;

        setPosition({ x: Math.round(pixelX), y: Math.round(pixelY) });
    };

    const handleMouseMove = (e: MouseEvent) =>
        isDragging && updatePosition(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
        if (isDragging) {
            e.preventDefault();
            updatePosition(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", () => setIsDragging(false));
            window.addEventListener("touchmove", handleTouchMove, {
                passive: false,
            });
            window.addEventListener("touchend", () => setIsDragging(false));
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("touchmove", handleTouchMove);
        };
    }, [isDragging]);

    const confirm = () => {
        onConfirm(position);
        if (onClose) {
            onClose();
        }
    };

    const close = () => {
        if (onClose) {
            onClose();
        }
    };

    return (
        <Dialog
            header="Clock position"
            visible={visible}
            className="sm:max-w-2xl"
            onClose={close}
            footer={<Button onClick={confirm}>SAVE POSITION</Button>}
        >
            <div className="flex flex-col items-center w-full">
                <div
                    ref={containerRef}
                    className="relative w-full bg-zinc-800 border-2 border-zinc-500 rounded-xl overflow-hidden touch-none"
                    style={{ aspectRatio: aspectRatio }}
                >
                    {/* Snap Guides */}
                    <div
                        className={`absolute inset-0 transition-opacity pointer-events-none ${isDragging ? "opacity-20" : "opacity-0"}`}
                    >
                        <div className="absolute top-1/2 w-full h-px bg-indigo-500" />
                        <div className="absolute left-1/2 h-full w-px bg-indigo-500" />
                        <div className="absolute inset-0 border-10 border-indigo-500/20" />
                    </div>

                    {/* The Draggable Clock */}
                    <div
                        onMouseDown={() => setIsDragging(true)}
                        onTouchStart={() => setIsDragging(true)}
                        style={{
                            left: `${(position.x / window.innerWidth) * 100}%`,
                            top: `${(position.y / window.innerHeight) * 100}%`,
                            transform: "translate(-50%, -50%)",
                        }}
                        className={`
                            absolute px-4 py-2 bg-white text-black font-bold font-mono rounded-lg shadow-2xl
                            cursor-grab active:cursor-grabbing select-none whitespace-nowrap z-10
                            ${isDragging ? "scale-110" : "scale-100"}
                            ${isSnapped && isDragging ? "ring-4 ring-yellow-400" : "ring-4 ring-transparent"}
                            transition-[transform,ring] duration-150
                        `}
                    >
                        {time}
                    </div>

                    {/* Coordinate HUD */}
                    <div className="absolute bottom-4 right-4 flex gap-4 text-[10px] font-black text-zinc-500 tracking-tighter uppercase bg-black/40 px-3 py-1 rounded-full border border-white/5 z-12">
                        <span>
                            X:{" "}
                            <span className="text-zinc-300">
                                {position.x}px
                            </span>
                        </span>
                        <span>
                            Y:{" "}
                            <span className="text-zinc-300">
                                {position.y}px
                            </span>
                        </span>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default PositionSelector;
