import Title from "@/app/components/title";
import DayView from "@/app/components/DayViewCalendar";
import Form from "@/app/components/form/Form";


export default function MakeReservation({}) {


    return (
        <div className="flex flex-col p-3 ml-56">
            <div className="h-7 p-2 my-5">

            </div>
            <div>
                <Title title="Reservation"/>
            </div>
            <div className="h-7 p-2 my-5">
                <span className="text-sm text-slate-900"><span className="text-green-700 font-extrabold">29 </span>ressources disponibles</span>
            </div>
            <div>
                <Form />
            </div>
        </div>
    )
}