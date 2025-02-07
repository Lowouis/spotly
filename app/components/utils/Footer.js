import {Divider} from "@nextui-org/react";
import React from "react";
import Link from "next/link";

export default function Footer(){
    return (
        <footer className="w-full text-slate-500 text-center py-4">
            <div className="flex flex-row justify-center items-center w-full ">
                <div className="flex flex-row space-x-3 justify-start items-start">
                    <div className="flex flex-row space-x-4 justify-start">
                        <span>Spotly Copyright © 2025 </span>
                    </div>
                    <Divider orientation="vertical" className="h-6 rounded-full"/>
                    <div
                        className="flex flex-row justify-center items-center space-x-1 transition-all">
                        <a
                            className="hover:cursor-pointer hover:text-slate-900"
                            href="https://github.com/Lowouis/spotly"
                            target="_blank"
                        >
                            Github
                        </a>
                    </div>
                    <div
                        className="flex flex-row justify-center items-center space-x-1 transition-all">
                        <a
                            className="hover:cursor-pointer hover:text-slate-900"
                            href="https://www.linkedin.com/in/louisgurita/"
                            target="_blank"
                        >
                            LinkedIn
                        </a>
                    </div>
                    <div
                        className="flex flex-row justify-center items-center space-x-1 transition-all">
                        <a
                            className="hover:cursor-pointer hover:text-slate-900"
                            href="https://www.youtube.com/channel/UCjtaWAPNoNn1r_O3H73yQUg"
                            target="_blank"
                        >
                            Youtube
                        </a>
                    </div>
                    <div
                        className="flex flex-row justify-center items-center space-x-1 transition-all">
                        <Link
                            className="hover:cursor-pointer hover:text-slate-900"
                            href="/faq"
                        >
                            FAQ
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}