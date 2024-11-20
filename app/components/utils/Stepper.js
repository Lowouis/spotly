import {Button} from "@nextui-org/button";
import {CheckIcon} from "@heroicons/react/24/outline";
import {Divider} from "@nextui-org/react";


export default function Stepper({step, done=false, last=false, content}){


    return (
        <div className="flex flex-row">
            <div className="flex flex-col justify-center items-center">
                <div
                    className={`flex justify-center items-center ${done ? "bg-blue-700" : "bg-transparent"} border-blue-700 border-4 rounded-full w-[64px] h-[64px]`}
                >
                    {done ? <CheckIcon color={"white"} width={34} height={34}/> :
                        <h2 className="text-2xl text-blue-800 font-semibold">{step}</h2>}
                </div>
                {!last && <div className={`h-[25px] flex justify-center items-center ${done ? "bg-blue-700" : "bg-neutral-300"} w-[4px] my-1 rounded-sm`}></div>}
            </div>
            <div className="flex justify-center items-start ml-3">
                {content}
            </div>
        </div>

            )
}