import React from "react";

type Orientation = "vertical" | "horizontal";

interface FormFieldProps {
    label: string;
    orientation?: Orientation;
    children: React.ReactNode;
    required?: boolean;
    className?: string;
}

/**
 * Simpler alternative to Field + FieldLabel + FieldTitle from shadcn/ui, with less styling.
 */
const FormField: React.FC<FormFieldProps> = ({
    label,
    orientation = "vertical",
    children,
    required = false,
    className = "",
}) => {
    const isHorizontal = orientation === "horizontal";

    return (
        <div
            className={`rounded-md border border-primary/60 p-4 custom-form-field ${isHorizontal ? "flex items-center gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-2" : "flex flex-col gap-2"} ${className}`}
        >
            <label
                className={`
          text-sm font-medium text-primary
          ${isHorizontal ? "shrink-0" : ""}
        `}
            >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {isHorizontal ? (
                <div className="ml-auto custom-form-field-control max-sm:ml-0 max-sm:w-full">{children}</div>
            ) : (
                <div className="w-full">{children}</div>
            )}
        </div>
    );
};

export default FormField;
