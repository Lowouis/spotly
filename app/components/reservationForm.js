import Title from "@/app/components/title";
import Input from "@/app/components/input";


export default function ReservationForm({}) {



    return (
        <div className="flex flex-col p-3">
            <div className="h-7 p-2 my-5">

            </div>
            <div>
                <Title title="Reservation"/>
            </div>

            <div className="h-7 p-2 my-5">
                <Input label=""/>
            </div>
        </div>
    );
}