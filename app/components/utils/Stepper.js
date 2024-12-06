import {Button} from "@nextui-org/button";
import {CheckIcon} from "@heroicons/react/24/outline";
import {useMutation} from "@tanstack/react-query";


export default function Stepper({step, done=false, last=false, content, handleReturnStep=null, adminMode=false, entry=null}) {



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
                    className={`flex justify-center items-center ${done ? "bg-blue-700" : "bg-transparent"} border-blue-700 border-4 rounded-full w-[64px] h-[64px]`}
                >
                    {done ? <CheckIcon color={"white"} width={34} height={34}/> :
                        <h2 className="text-2xl text-blue-800 font-semibold">{step}</h2>}
                </div>
                {!last && <div className={`h-[25px]  flex justify-center items-center ${done ? "bg-blue-700" : "bg-neutral-300"} w-[4px] my-1 rounded-sm`}></div>}
            </div>
            <div className="flex justify-center items-start ml-3">
                {content}
            </div>
            {adminMode || handleReturnStep && done &&
                <div className="ml-10 flex justify-center items-center">
                    <Button onPress={handleReturnStep} color="primary" size="lg">Retourner</Button>
                </div>
            }
            {step===2 && adminMode && !done && <Button className="ml-10" onPress={confirm} color="success" size="lg">Autoriser</Button>}
        </div>

            )
}