'use client';
import {useState} from "react";


export default function ReservationFormConfirmation({setSummary}) {

    const [comment, setComment] = useState(false);
    const  handleCommentSwitch = () => {
        console.log("Switched");
        //add comment form
        setComment(!comment);
    }

    const handleReturn = () => {
        console.log("Return");
        setSummary(false);
    }
    const handleConfirmation = () => {
        console.log("Confirmation");
    }
    return (
        <div className="flex flex-col space-y-6 my-4">

        </div>
    )
}