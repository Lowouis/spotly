import SideCard from "@/app/components/utils/SideCard";
import { ArrowRightCircleIcon, ArrowLeftCircleIcon} from "@heroicons/react/24/outline";


export default function TimeSlot({time, onClick, active, handleClickSlot, currentSlot}) {

    const timeSlots = ["8:00", "9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];



    return (
        <div className="w-full mx-2 max-w-lg text-neutral-800">
            <h1 className="text-xl my-2">Crénaux disponible</h1>
                <div className="text-start">
                    <p className="font-semibold text-sm">vendredi</p>
                    <p className="text-sm whitespace-nowrap">27 sept.</p>
                    <div className="flex flex-row">
                        <div className="mt-2 space-y-1 w-1/6">
                            <ul>
                            {timeSlots.map((time, idx) => (
                                <li
                                    onClick={() => handleClickSlot(time)}
                                    key={idx}
                                    className={`${currentSlot===time ? "bg-amber-400" : "bg-amber-200 hover:bg-amber-300"} text-center my-1 cursor-pointer block w-full py-1  rounded-lg text-sm transition duration-300 ease-in-out opacity-100`}
                                >
                                    {time}
                                </li>

                            ))}
                            </ul>
                            <div className="flex flex-row justify-center">
                                <ArrowLeftCircleIcon className=" h-6 w-6 cursor-pointer mr-5 text-neutral-900 hover:text-neutral-600 transition " />
                                <ArrowRightCircleIcon className="h-6 w-6 cursor-pointer text-neutral-900 hover:text-neutral-600 transition " />
                            </div>
                        </div>
                        <div className="mt-2 ml-2 w-full">
                            <SideCard />
                        </div>
                    </div>
                </div>
        </div>
    )
}