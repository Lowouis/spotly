import Title from "@/app/components/title";
import {Dropdown} from "@/app/components/input";
import {useState} from "react";
import {now} from "next-auth/client/_utils";
import DatePicker from "@/app/components/datepicker";
import Example from "@/app/components/datepicker";


export default function MakeReservation({}) {


    const sites = [
        {id: 1, name: "Caen"},
        {id: 2, name: "Hérouville"},
        {id: 2, name: "BETHARAM"},
        {id: 3, name: "Bayeux"},
    ]
    const categories = [
        {id: 1, name: "Voiture"},
        {id: 2, name: "Ordinateur"},
        {id: 3, name: "Salle"},
    ]
    const years = [
        {id: 1, name: 2024},
        {id: 2, name: 2025},
        {id: 3, name: 2026},
        {id: 4, name: 2027},
        {id: 5, name: 2028}
    ]
    const months = [
        {id: 1,  name: "Septembre"},
        {id: 2,  name: "Octobre"},
        {id: 3,  name: "Novembre"},
        {id: 4,  name: "Décembre"},
        {id: 5,  name: "Janvier"},
        {id: 6,  name: "Février"},
        {id: 7,  name: "Mars"},
        {id: 8,  name: "Avril"},
        {id: 9,  name: "Mai"},
        {id: 10, name: "Juin"},
        {id: 11, name: "Juillet"},
        {id: 12, name: "Août"},
    ];

    const [selectedDate, setSelectedDate] = useState({
        "year": new Date().getFullYear(),
        "month": months[new Date().getMonth()].name,
        "day": null
    });

    const daysInMonth = Array.from({ length: new Date(selectedDate.year, months.find(month => month.name === selectedDate.month).id, 0).getDate() }, (_, i) => ({ id: i, name: i }));


    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);


    return (
        <div class="flex flex-col p-3 ">
            <div className="h-7 p-2 my-5">

            </div>
            <div>
                <Title title="Reservation"/>
            </div>
            <div className="h-7 p-2 my-5">
                <span className="text-sm text-slate-900"><span className="text-green-700 font-extrabold">29</span> ressources disponibles</span>
            </div>
            <div>
                <Dropdown items={categories} label="Site"/>
                <Dropdown items={categories} label="Catégorie"/>
                <DatePicker  />
                <Dropdown items={categories} label="Ressources"/>

            </div>
        </div>
    )
}