"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import {cn} from "@/lib/utils";

const ChartContext = React.createContext(null);

function useChart() {
    const context = React.useContext(ChartContext);
    if (!context) throw new Error("useChart must be used within a <ChartContainer />");
    return context;
}

const ChartContainer = React.forwardRef(({id, className, children, config, ...props}, ref) => {
    const uniqueId = React.useId();
    const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

    return (
        <ChartContext.Provider value={{config}}>
            <div
                data-chart={chartId}
                ref={ref}
                className={cn("flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-grid_line]:stroke-border/60 [&_.recharts-tooltip-cursor]:fill-muted", className)}
                {...props}
            >
                <ChartStyle id={chartId} config={config} />
                <RechartsPrimitive.ResponsiveContainer>
                    {children}
                </RechartsPrimitive.ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    );
});
ChartContainer.displayName = "ChartContainer";

const ChartStyle = ({id, config}) => {
    const colorConfig = Object.entries(config).filter(([, value]) => value?.color);
    if (!colorConfig.length) return null;

    return (
        <style dangerouslySetInnerHTML={{
            __html: `[data-chart=${id}] { ${colorConfig.map(([key, itemConfig]) => `--color-${key}: ${itemConfig.color};`).join(" ")} }`,
        }} />
    );
};

const ChartTooltip = RechartsPrimitive.Tooltip;
const ChartLegend = RechartsPrimitive.Legend;

const ChartTooltipContent = React.forwardRef(({active, payload, className, hideLabel = false, labelFormatter, formatter}, ref) => {
    const {config} = useChart();

    if (!active || !payload?.length) return null;

    const label = payload[0]?.payload?.label || payload[0]?.payload?.month || payload[0]?.label;

    return (
        <div ref={ref} className={cn("grid min-w-32 gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl", className)}>
            {!hideLabel && label && (
                <div className="font-medium">
                    {labelFormatter ? labelFormatter(label, payload) : label}
                </div>
            )}
            <div className="grid gap-1.5">
                {payload.map((item) => {
                    const key = item.name && config[item.name] ? item.name : item.dataKey || item.name;
                    const itemConfig = config[key] || {};

                    return (
                        <div key={key} className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{backgroundColor: item.color}} />
                            <span className="text-muted-foreground">{itemConfig.label || item.name}</span>
                            <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                                {formatter ? formatter(item.value, item.name, item, payload) : item.value}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
ChartTooltipContent.displayName = "ChartTooltipContent";

const ChartLegendContent = React.forwardRef(({className, payload, nameKey}, ref) => {
    const {config} = useChart();

    if (!payload?.length) return null;

    return (
        <div ref={ref} className={cn("flex items-center justify-center gap-4", className)}>
            {payload.map((item) => {
                const key = item.payload?.[nameKey] || item.dataKey || item.value;
                const itemConfig = config[key] || {};

                return (
                    <div key={key} className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{backgroundColor: item.color}} />
                        <span>{itemConfig.label || item.value}</span>
                    </div>
                );
            })}
        </div>
    );
});
ChartLegendContent.displayName = "ChartLegendContent";

export {ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent};
