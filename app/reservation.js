
import Title from "@/app/components/utils/title";

import {ReservationFormFirst, ReservationFormSecond} from "@/app/components/form/user/ReservationForms";
import {useState} from "react";


export default function MakeReservation({}) {

    const [step, setStep] = useState(1);

    return (
        <div className="flex flex-col p-3 w-full">
            <div>
                <Title title="Reservation"/>
            </div>


              {step === 1 && <ReservationFormFirst setStep={setStep} />}
            {step === 2 && <ReservationFormSecond setStep={setStep} />}
        </div>
    );
}