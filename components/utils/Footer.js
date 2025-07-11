'use client'
import React from "react";
import {usePathname} from "next/navigation";

export default function Footer(){
    const pathname = usePathname();
    return pathname.startsWith('/admin') ? null : (
        <footer className="w-full text-center py-4  text-slate-500 dark:text-slate-300">
            <div className="flex flex-row justify-center items-center w-full ">
                <div className="flex flex-row space-x-3 justify-start items-start">
                    <div className="flex flex-row space-x-4 justify-start">
                        <span>Spotly GNU General Public License </span>
                    </div>
                    <div>
                        |
                    </div>
                    <div
                        className="flex flex-row justify-center items-center space-x-1 transition-all">
                        <a
                            className="hover:cursor-pointer"
                            href="https://github.com/Lowouis/spotly"
                            target="_blank"
                        >
                            Github
                        </a>
                    </div>
                    <div
                        className="flex flex-row justify-center items-center space-x-1 transition-all">
                        <a
                            className="hover:cursor-pointer"
                            href="https://www.youtube.com/channel/UCjtaWAPNoNn1r_O3H73yQUg"
                            target="_blank"
                        >
                            Youtube
                        </a>
                    </div>

                </div>
            </div>
        </footer>
    )
}