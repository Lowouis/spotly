'use client';


import {Image} from "@heroui/react";
import nextConfig from '../../next.config.mjs';

const basePath = nextConfig.basePath || '';

export default function Banner() {
    return (
        <div className="flex justify-center w-full">
            <Image src={`${basePath}/banner.png`} radius="none" height={200} alt="Banner"/>
        </div>
    );
}

