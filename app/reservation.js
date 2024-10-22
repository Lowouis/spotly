
import Title from "@/app/components/utils/title";

import {ReservationForm} from "@/app/components/form/user/ReservationForms";
import {useState} from "react";
import {Chip} from "@nextui-org/react";
import ReservationUserListing from "@/app/components/reservations/Listings";
import ReservationFormConfirmation from "@/app/components/form/ReservationFormConfirmation";


export default function MakeReservation({session}) {

    const [step, setStep] = useState(1);

    return (
        <div className="flex flex-col p-3 w-full mx-5">
            <div className="flex flex-col ">
                <div className="flex lg:flex-row w-full md:flex-col md:items-center">
                    <ReservationForm />
                    <ReservationUserListing user={session?.user} />
                </div>
            </div>
        </div>
    );
}