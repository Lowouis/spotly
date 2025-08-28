'use client';


import {Image} from "@heroui/react";
import nextConfig from '../../next.config.mjs';

const basePath = nextConfig.basePath || '';

export default function Banner() {
    return (
        <div className="flex justify-center w-full">
            <Image
                src={`${basePath}/banner.png`}
                radius="none"
                height={120}
                className="h-24 sm:h-[200px] w-auto object-contain"
                alt="Banner"
            />
        </div>
    );
}

