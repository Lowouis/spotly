import {Button} from "@nextui-org/button";
import {CheckIcon} from "@heroicons/react/24/outline";
import {useMutation} from "@tanstack/react-query";
import React from "react";
import {ButtonGroup} from "@nextui-org/react";
import process from "next/dist/build/webpack/loaders/resolve-url-loader/lib/postcss";
import {useAdminDataManagerContext} from "@/app/context/AdminDataManager";
import {XMarkIcon} from "@heroicons/react/24/solid";


export default function Stepper({step, done=false, last=false, content, handleReturnStep=null, adminMode=false, entry=null, returned, failed}) {

    const { updateEntryModerate } = useAdminDataManagerContext();

    return (
        <div className="flex flex-row ">
            <div className="flex flex-col justify-center items-center">
                <div
                    className={`flex justify-center items-center ${done & !failed && "bg-blue-700"}  border-blue-700 ${failed && "bg-red-700 border-red-700"} border-4 rounded-full w-[64px] h-[64px]`}
                >
                    {!failed && done && <CheckIcon color={"white"} width={34} height={34}/>}
                    {!failed && !done && <h2 className="text-2xl text-blue-800 font-semibold">{step}</h2>}
                    {failed && <h2 className="text-2xl text-white font-semibold">X</h2>}
                </div>
                {!last && <div className={`h-[25px] flex justify-center items-center ${done && !failed ? "bg-blue-700" : failed ? "bg-red-600" : "bg-neutral-300"} w-[4px] my-1 rounded-sm`}></div>}
            </div>
            <div className="flex justify-center items-start ml-3">
                {content}
            </div>
            {step===2 && adminMode && !done && (
                <div className="flex justify-center items-start">
                    <ButtonGroup className="ml-10">
                        <Button variant="ghost" onPress={()=> {
                            updateEntryModerate(entry, "REFUSED");
                        }} color="default" size="md">
                            <XMarkIcon width="18" height="18" color={"red"} />
                        </Button>
                        <Button variant="ghost" onPress={()=>updateEntryModerate(entry, "ACCEPTED")} color="default" size="md">
                            <CheckIcon width="18" height="18" color={"green"}/>
                        </Button>
                    </ButtonGroup>
                </div>

            )}
        </div>

            )
}