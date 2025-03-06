'use client';
import React from "react";
import {useTheme} from "@/app/context/ThemeContext";
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
                                size = 1,
                                spacing = 10,
                                children,
                                className,
                                style = {
                                    backgroundColor: "white",
                                },
                            }: DotProps) {

    const {theme} = useTheme();

    return (
        <div
            style={{
                ...style,
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: theme === "dark" ? "#1E201E" : "#F8FAFC",
                backgroundImage: `radial-gradient(${theme === 'dark' ? '#697565' : "#DCD7C9"} ${size}px, transparent ${size}px)`,
                backgroundSize: `calc(${spacing} * ${size}px) calc(${spacing} * ${size}px)`,
                zIndex: -1,
            }}
            className={className}
        >
            {children ?? <Placeholder />}
        </div>
    );
}
