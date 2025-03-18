import {CheckIcon} from "@heroicons/react/24/outline";
import React from "react";

export default function Stepper({step, done=false, last=false, content, handleReturnStep=null, adminMode=false, entry=null, returned, failed}) {
    return (
        <div className="flex flex-row ">
            <div className="flex flex-col justify-center items-center">
                <div
                    className={`flex justify-center items-center ${done & !failed && "bg-blue-600"} ${failed && "bg-red-500 border-red-600"} border-2 rounded-full w-[64px] h-[64px]`}
                >
                    {!failed && done && <CheckIcon color={"white"} width={34} height={34}/>}
                    {!failed && !done && <h2 className="text-2xl text-blue-800">{step}</h2>}
                    {failed && <h2 className="text-2xl text-white">X</h2>}
                </div>
                {!last && <div className={`h-[25px] flex justify-center items-center ${done && !failed ? "bg-blue-700" : failed ? "bg-red-600" : "bg-neutral-300"} w-[4px] my-1 rounded-sm`}></div>}
            </div>
            <div className="flex justify-center items-start ml-3">
                {content}
            </div>
        </div>

            )
}