import {CheckIcon} from "@heroicons/react/24/outline";
import React from "react";
import {IoCloseSharp} from "react-icons/io5";

export default function Stepper({step, done=false, last=false, content, handleReturnStep=null, adminMode=false, entry=null, returned, failed}) {
    return (
        <div className="flex flex-row">
            <div className="flex flex-col justify-center items-center">
                <div
                    className={`flex justify-center items-center w-12 h-12 sm:w-[64px] sm:h-[64px] rounded-full transition-all duration-300 ease-in-out
                        ${done && !failed ? "bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30" :
                        failed ? "bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/30" :
                            "bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800 shadow-lg shadow-neutral-500/10"}
                        ${!done && !failed ? "border-2 border-blue-400/30 dark:border-blue-500/30" : "border-none"}
                    `}
                >
                    {!failed && done && (
                        <CheckIcon
                            width={24}
                            height={24}
                            className="text-white animate-scale-check sm:w-8 sm:h-8"
                        />
                    )}
                    {!failed && !done && (
                        <h2 className="text-lg sm:text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-300 dark:to-blue-500">
                            {step}
                        </h2>
                    )}
                    {failed && (
                        <div className="text-2xl sm:text-3xl font-semibold">
                            <IoCloseSharp/>
                        </div>
                    )}
                </div>
                {!last && (
                    <div className={`h-6 sm:h-[25px] w-[3px] my-1 rounded-full transition-all duration-300 ease-in-out
                        ${done && !failed ? "bg-gradient-to-b from-blue-400 to-blue-600" :
                        failed ? "bg-gradient-to-b from-red-400 to-red-600" :
                            "bg-gradient-to-b from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800"}
                    `}></div>
                )}
            </div>
            <div className="flex justify-center items-start ml-4 text-neutral-600 dark:text-neutral-300">
                {content}
            </div>
        </div>
    )
}