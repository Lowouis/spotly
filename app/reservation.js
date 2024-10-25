import {ReservationForm} from "@/app/components/form/ReservationSearch";
import {useState} from "react";
import ReservationUserListing from "@/app/components/reservations/Listings";


export default function MakeReservation({session}) {

    const [step, setStep] = useState(1);

    return (
        <div className="flex flex-col p-3 w-full">
            <div className="flex flex-col justify-center items-center ">
                <div className="flex lg:flex-row w-full md:flex-col md:items-start lg:w-3/4">

                    {/*<ReservationUserListing user={session?.user} />*/}
                </div>
            </div>
        </div>
    );
}