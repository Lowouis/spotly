import ModalCheckingBooking from "@/components/modals/ModalCheckingBooking";
import {Alert, Tab, Tabs} from "@nextui-org/react";
import {useState} from "react";


const handleStatus = (entry) => {
    if (entry.moderate === "REJECTED") {
        return "rejected";
    }else if(entry.moderate === "WAITING"){
        return "waiting";
    } else if (entry.moderate === "ACCEPTED" && entry.startDate > new Date().toISOString()){
        return "upcoming";
    } else if (entry.moderate==="ENDED" && entry.returned){
        return "ended";
    } else if (entry.endDate < new Date().toISOString() && !entry.returned && entry.moderate === "USED"){
        return "delayed";
    } else if(entry.moderate === "USED" ){
        return "ongoing";
    } else if (entry.endDate <= new Date().toISOString() && entry.moderate=== "ACCEPTED"){
        return "expired";
    } else {
        return "begin";
    }
}


export default function ReservationUserListing({entries, handleRefresh}) {
    const [userAlert, setUserAlert] = useState({
        title: "",
        description: "",
        status : ""
    });

    const sortEntriesByStatus = (entries) => {
        const entriesByStatus = {
            waiting: [],
            ongoing: [],
            upcoming: [],
            ended: [],
        }
        entries.forEach((entry) => {
            if (handleStatus(entry) === "waiting") {
                entriesByStatus.waiting.push(entry);
            } else if (handleStatus(entry) === "upcoming") {
                entriesByStatus.upcoming.push(entry);
            } else if (handleStatus(entry) === "begin") {
                entriesByStatus.ongoing.push(entry);
            } else if (handleStatus(entry) === "ended" || handleStatus(entry) === "expired" || handleStatus(entry) === "rejected") {
                entriesByStatus.ended.push(entry);
            } else {
                entriesByStatus.ongoing.push(entry);
            }
        })
        return entriesByStatus;
    }
    return (
        <div className="mx-2 my-1 w-full flex flex-col items-center justify-center sm:w-full md:w-1/2 lg:w-1/3">
            {userAlert.title !== "" && (
                <div className="flex items-center justify-center w-full">
                    <Alert
                        description={userAlert.description}
                        title={userAlert.title}
                        color={userAlert.status}
                        variant="solid"
                        onClose={() => setUserAlert({title: "", description: "", status: ""})}
                    />
                </div>
            )}
            { entries && entries?.length > 0 ? (
                <div className="w-full flex-col flex justify-between items-center">
                    <Tabs color="default" variant="underlined" aria-label="entries_sort" default="all" fullWidth>
                        <Tab key="all" title="Toutes" className="w-full">
                            {renderEntries(sortEntriesByStatus(entries), handleRefresh, true, setUserAlert)}
                        </Tab>
                        <Tab key="ongoing" title="En cours"  className="w-full">
                            {renderEntries({ongoing: sortEntriesByStatus(entries).ongoing}, handleRefresh, setUserAlert)}
                        </Tab>
                        <Tab key="coming" title="À venir"  className="w-full">
                            {renderEntries({upcoming: sortEntriesByStatus(entries).upcoming}, handleRefresh, setUserAlert)}
                        </Tab>
                        <Tab key="awaiting" title="En attente"  className="w-full">
                            {renderEntries({waiting: sortEntriesByStatus(entries).waiting}, handleRefresh, setUserAlert)}
                        </Tab>
                        <Tab key="ended" title="Terminé"  className="w-full">
                            {renderEntries({ended: sortEntriesByStatus(entries).ended}, handleRefresh, setUserAlert)}
                        </Tab>

                    </Tabs>

                </div>
            ) : (
                <div className="flex justify-center items-center mt-4 p-3">
                    <h1 className="text-lg opacity-75 dark:text-neutral-300 text-neutral-600 text-center font-bold">Aucune
                        réservation</h1>
                </div>
            )}
        </div>
    )
}

export function renderEntries(entries, handleRefresh, all=false, setUserAlert){
    const tagsGreatNames = [
        "En attente",
        "En cours",
        "A venir",
        "Terminé"
    ]


    return (
        <div className="w-full flex flex-col text-neutral-700 dark:text-white">
            {Object.keys(entries).map((tag, key) => (
                <div key={tag}>
                    {entries[tag].length > 0 && (
                        <div>
                            <h2 className="text-sm font-semibold">{all === true && tagsGreatNames[key]}</h2>
                            {entries[tag].map((entry) => (
                                <div key={entry.id}
                                     className="w-full flex justify-between items-center p-3 rounded-lg mb-2 dark:bg-neutral-800 bg-neutral-100 ">
                                    <div className="flex flex-row space-x-6 mx-3 items-center">
                                        <div className="flex flex-col">
                                            <div className="text-xl font-bold">
                                                {entry.resource.name}
                                            </div>
                                            <div
                                                className={`text-sm flex flex-row space-x-3 justify-start items-center`}>
                                                <div className="flex justify-center items-center relative w-3">
                                                    {/* Fond statique */}
                                                    <div className={`w-3 h-3 absolute
                                                        ${handleStatus(entry) === "waiting" && "bg-amber-600"}
                                                        ${handleStatus(entry) === "ended" && "bg-slate-600"}
                                                        ${handleStatus(entry) === "delayed" && "bg-red-600"}
                                                        ${handleStatus(entry) === "upcoming" && "bg-blue-600"}
                                                        ${handleStatus(entry) === "begin" && "bg-green-600"}
                                                        ${handleStatus(entry) === "ongoing" && "bg-violet-800"}
                                                        ${handleStatus(entry) === "expired" && "bg-red-800"}
                                                        ${handleStatus(entry) === "rejected" && "bg-red-500"}
                                                        rounded-full`}>
                                                        </div>
                                                        {/* Animation de ping */}
                                                        {(handleStatus(entry) === "delayed" || handleStatus(entry) === "used") && (
                                                        <div className={`w-3 h-3 absolute
                                                        ${handleStatus(entry) === "delayed" && "bg-red-600"}
                                                        ${handleStatus(entry) === "ongoing" && "bg-violet-800"}
                                                        rounded-full animate-ping opacity-75`}></div>
                                                        )}
                                                </div>
                                                <div>
                                                    {handleStatus(entry) === "upcoming" && "À venir le " + new Date(entry.startDate).toLocaleDateString("fr-FR", {
                                                        "year": "numeric",
                                                        "month": "2-digit",
                                                        "day": "numeric",
                                                        "hour": "2-digit",
                                                        "minute": "2-digit"
                                                    })}
                                                    {handleStatus(entry) === "waiting" && "En attente"}
                                                    {handleStatus(entry) === "ended" && "Rendu le " + new Date(entry.updatedAt).toLocaleDateString("fr-FR", {
                                                        "year": "numeric",
                                                        "month": "2-digit",
                                                        "day": "numeric",
                                                        "hour": "2-digit",
                                                        "minute": "2-digit"
                                                    })}
                                                    {handleStatus(entry) === "delayed" && "En retard de " + `${Math.floor((new Date() - new Date(entry.endDate)) / (1000 * 60 * 60))}h${Math.floor(((new Date() - new Date(entry.endDate)) % (1000 * 60 * 60)) / (1000 * 60))}min`}
                                                    {handleStatus(entry) === "expired" && "Expiré"}
                                                    {handleStatus(entry) === "begin" && "Disponible"}
                                                    {handleStatus(entry) === "ongoing" && "En cours d'utilisation"}
                                                    {handleStatus(entry) === "rejected" && "Rejeté"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <ModalCheckingBooking entry={entry} handleRefresh={handleRefresh} setUserAlert={setUserAlert}/>
                                    </div>
                                </div>
                            ))}
                        </div>)}
                </div>
            ))}
        </div>
    );
}



