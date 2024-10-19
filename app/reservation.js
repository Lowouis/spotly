
import Title from "@/app/components/utils/title";

import {ReservationForm} from "@/app/components/form/user/ReservationForms";
import {useState} from "react";
import {Chip} from "@nextui-org/react";
import ReservationUserListing from "@/app/components/reservations/Listings";


export default function MakeReservation({session}) {

    const [step, setStep] = useState(1);

    return (
        <div className="flex flex-col p-3 w-full mx-5">
            <div className="flex flex-col ">
                <div className="flex flex-row w-full">
                    <ReservationForm />
                    <ReservationUserListing user={session?.user} />
                </div>
            </div>
        </div>
    );
}