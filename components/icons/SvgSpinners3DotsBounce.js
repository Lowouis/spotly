import * as React from "react";

export function SvgSpinners3DotsBounceIcon({
    size = 24,
    color = "currentColor",
    strokeWidth = 2,
    className,
    ...props
}) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            <circle cx="4" cy="12" r="3">
                <animate id="spotlySpinnerDotStart" attributeName="cy" begin="0;spotlySpinnerDotEnd.end+0.25s" calcMode="spline" dur="0.6s" keySplines=".33,.66,.66,1;.33,0,.66,.33" values="12;6;12" />
            </circle>
            <circle cx="12" cy="12" r="3">
                <animate attributeName="cy" begin="spotlySpinnerDotStart.begin+0.1s" calcMode="spline" dur="0.6s" keySplines=".33,.66,.66,1;.33,0,.66,.33" values="12;6;12" />
            </circle>
            <circle cx="20" cy="12" r="3">
                <animate id="spotlySpinnerDotEnd" attributeName="cy" begin="spotlySpinnerDotStart.begin+0.2s" calcMode="spline" dur="0.6s" keySplines=".33,.66,.66,1;.33,0,.66,.33" values="12;6;12" />
            </circle>
        </svg>
    );
}
