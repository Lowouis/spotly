import {useEffect, useState} from "react";
import Title from "@/app/components/utils/title";
import {
    Accordion,
    AccordionItem,
    Modal, ModalBody,
    ModalContent, ModalFooter,
    ModalHeader,
    ScrollShadow,
    Skeleton,
    Tooltip
} from "@nextui-org/react";
import {ExclamationTriangleIcon, InformationCircleIcon} from "@heroicons/react/24/outline";
import {Button} from "@nextui-org/button";
import {EyeIcon, KeyIcon, ShieldExclamationIcon} from "@heroicons/react/24/solid";
import ModalCheckingBooking from "@/app/components/modals/ModalCheckingBooking";


export default function ReservationUserListing({entries}) {




    const isEntryDelayed = (endDate) => {
        return Date.now() > new Date(endDate).getTime()
    }
    return (
        <div className="mx-2 my-1 lg:w-1/3 lg:flex lg:flex-col md:w-full lg:items-start lg:justify-start ">
            {entries && entries?.length > 0 ? (
                <div className="w-full flex justify-between items-center">
                    <div className="w-full flex flex-col">
                        {entries?.map((entry) => (
                            <div key={entry.id}
                                 className="w-full flex justify-between items-center py-3 bg-neutral-50 hover:bg-neutral-100 p-1 rounded-lg mb-2">
                                <div className="flex flex-row space-x-6 mx-3 items-center">
                                    <div className="text-xl font-bold">
                                        {entry.resource.name}
                                    </div>
                                </div>
                                <div>
                                    <ModalCheckingBooking entry={entry}/>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div>
                    <h1 className="text-2xl text-center">Aucune réservation</h1>
                </div>
            )}
        </div>
    )
}



