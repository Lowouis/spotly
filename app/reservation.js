
import Title from "@/app/components/utils/title";

import {
    ReservationForm,
    ReservationSideElements
} from "@/app/components/form/user/ReservationForms";
import {useState} from "react";


export default function MakeReservation({}) {

    const [step, setStep] = useState(1);

    return (
        <div className="flex flex-col p-3 w-2/3">
            <div>
                <Title title="Reservation"/>
            </div>
            <div className="flex flex-row">
                <ReservationForm />
                <ReservationSideElements  />
            </div>
        </div>
    );
}