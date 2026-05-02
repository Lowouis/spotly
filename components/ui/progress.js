import * as React from "react";
import {cn} from "@/lib/utils";

function Progress({value = 0, className, ...props}) {
    return (
        <div
            className={cn("relative h-2 overflow-hidden rounded-full bg-secondary", className)}
            {...props}
        >
            <div
                className="h-full w-full flex-1 rounded-full bg-primary transition-all duration-500 ease-out"
                style={{transform: `translateX(-${100 - value}%)`}}
            />
        </div>
    );
}

function ProgressDemo() {
    const [progress, setProgress] = React.useState(13);

    React.useEffect(() => {
        const timer = setTimeout(() => setProgress(66), 500);
        return () => clearTimeout(timer);
    }, []);

    return <Progress value={progress} className="w-[60%]" />;
}

export {Progress, ProgressDemo};
