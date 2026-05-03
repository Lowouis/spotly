'use client';

import {publicEnv} from '@/config/publicEnv';
import {cn} from "@/lib/utils";

export default function SnakeLogo({className, title = "Logo Spotly"}) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={`${publicEnv.basePath}/favicon.svg`}
            alt={title}
            className={cn('block object-contain dark:invert', className)}
            draggable={false}
        />
    );
}
