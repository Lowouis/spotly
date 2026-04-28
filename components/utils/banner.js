'use client';


import {Image} from "@heroui/react";
import {publicEnv} from '@/config/publicEnv';

const basePath = publicEnv.basePath;

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
