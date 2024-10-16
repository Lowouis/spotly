
import Title from "@/app/components/title";
import Form from "@/app/components/form/Form";


export default function MakeReservation({}) {

    return (
        <div className="flex flex-col p-3 ml-56">
            <div>
                <Title title="Reservation"/>
            </div>
            <div>
                <Form/>
            </div>
        </div>
    )
}