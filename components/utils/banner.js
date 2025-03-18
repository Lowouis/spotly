'use client';


import {Image} from "@nextui-org/react";

export default function Banner(){

    
    return (
        <div className="mx-auto">
            <div className="flex flex-col justify-center items-center">
                <Image src={"/banner.png"} radius="none" height={200} alt="Banner"/>
            </div>
        </div>
    );
}

