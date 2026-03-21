import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

type DialogProps = {
    visible: boolean;
    header?: string;
    footer?: React.ReactNode;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
};

export const Dialog: React.FC<DialogProps> = ({
    visible,
    header,
    footer,
    onClose,
    children,
    className,
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !visible) return null;

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Panel */}
            <div
                className={cn(
                    "relative z-10 w-full md:max-w-2xl lg:max-w-3xl mx-4 rounded-xl bg-white/40 backdrop-blur-xl shadow-xl p-6",
                    className,
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-4 text-gray-700 hover:text-black transition"
                    aria-label="Close dialog"
                >
                    ✕
                </button>

                {header && (
                    <h2 className="text-lg font-semibold mb-4 pr-8">
                        {header}
                    </h2>
                )}

                <div>{children}</div>

                {footer && (
                    <div className="mt-4 pt-2 flex justify-end gap-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
};
