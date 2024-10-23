import {ReservationForm} from "@/app/components/form/user/ReservationForms";
import {useState} from "react";
import ReservationUserListing from "@/app/components/reservations/Listings";


export default function MakeReservation({session}) {

    const [step, setStep] = useState(1);

    return (
        <div className="flex flex-col p-3 w-full mx-5">
            <div className="flex flex-col ">
                <div className="flex lg:flex-row w-full md:flex-col md:items-start lg:items-center lg:justify-center">
                    <ReservationForm />
                    <ReservationUserListing user={session?.user} />
                </div>
            </div>
        </div>
    );
}