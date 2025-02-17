import React from "react";

interface DotProps {
    /**
     * Color of the dot
     */
    color?: string;

    /**
     * Size of the dot in pixels
     */
    size?: number;

    /**
     * Spacing between dots
     */
    spacing?: number;

    /**
     * Content of the component
     */
    children?: React.ReactNode;

    /**
     * Class name
     */
    className?: string;

    style?: React.CSSProperties;
}

function Placeholder() {
    return (
        <div className="flex h-full min-h-64 w-full min-w-72 items-center justify-center">

        </div>
    );
}

export default function Dot({
                                color = "#cacaca",
                                size = 1,
                                spacing = 10,
                                children,
                                className,
                                style = {
                                    backgroundColor: "white",
                                },
                            }: DotProps) {
    return (
        <div
            style={{
                ...style,
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundImage: `radial-gradient(${color} ${size}px, transparent ${size}px)`,
                backgroundSize: `calc(${spacing} * ${size}px) calc(${spacing} * ${size}px)`,
                zIndex: -1,
            }}
            className={className}
        >
            {children ?? <Placeholder />}
        </div>
    );
}
