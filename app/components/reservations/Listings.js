import ModalCheckingBooking from "@/app/components/modals/ModalCheckingBooking";

export default function ReservationUserListing({entries, handleRefresh}) {
    return (
        <div className="mx-2 my-1 lg:w-1/3 lg:flex lg:flex-col md:w-full lg:items-center lg:justify-center ">
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
                                    <ModalCheckingBooking entry={entry} handleRefresh={handleRefresh}/>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex justify-center items-center">
                    <h1 className="text-2xl text-center">Aucune réservation</h1>
                </div>
            )}
        </div>
    )
}



