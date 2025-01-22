import {Button} from "@nextui-org/button";
import {CheckIcon} from "@heroicons/react/24/outline";
import {useMutation} from "@tanstack/react-query";
import React from "react";


export default function Stepper({step, done=false, last=false, content, handleReturnStep=null, adminMode=false, entry=null, returned, failed}) {



    // ADMIN MODE
    // CONFIRMATION OF AN ENTRY
     const { mutate } = useMutation({
         mutationFn: async ({entry}) => {
             const response = await fetch(`http://localhost:3000/api/entry/${entry.id}`, {
                 method: 'PUT',
                 headers: {
                     'Content-Type': 'application/json',
                 },
                 body: JSON.stringify({
                     moderate: "ACCEPTED",
                 }),
             });
             if (!response.ok) {
                 throw new Error('Failed to update entry');
             }
             console.log("SENDING REQUEST");
             return response.json();
         },
         onMutate: () => {
             //setRefresh(true);
         },
         onSuccess: () => {
             //setRefresh(true);
             console.debug("Entry updated");
         },
         onError: (error) => {
             console.error(error);
             console.debug("Entry NOT updated");

         },
     });
     const confirm = (e) => {
         mutate({entry});
     }




    return (
        <div className="flex flex-row">
            <div className="flex flex-col justify-center items-center">
                <div
                    className={`flex justify-center items-center ${done & !failed && "bg-blue-700"}  border-blue-700 ${failed && "bg-red-700 border-red-700"} border-4 rounded-full w-[64px] h-[64px]`}
                >
                    {!failed && done && <CheckIcon color={"white"} width={34} height={34}/>}
                    {!failed && !done && <h2 className="text-2xl text-blue-800 font-semibold">{step}</h2>}
                    {failed && <h2 className="text-2xl text-white font-semibold">X</h2>}
                </div>
                {!last && <div className={`h-[25px]  flex justify-center items-center ${done ? "bg-blue-700" : "bg-neutral-300"} w-[4px] my-1 rounded-sm`}></div>}
            </div>
            <div className="flex justify-center items-start ml-3">
                {content}
            </div>
            {step===2 && adminMode && !done && <Button variant="flat" className="ml-10" onPress={confirm} color="primary" size="lg">Autoriser</Button>}
        </div>

            )
}