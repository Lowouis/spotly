import {useEffect, useState} from "react";
import {Chip, ScrollShadow, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import {EyeIcon, TrashIcon} from "@heroicons/react/24/outline";
import Title from "@/app/components/utils/title";


export default function ReservationUserListing({user}) {

    const [entries, setEntries] = useState(null);

    useEffect(() => {
        const fetchEntries = ()=> {
            if(user){
                fetch(`http://localhost:3000/api/entry/?userId=${user.id}`)
                    .then(response => response.text())
                    .then(text => {
                        try {
                            const data = JSON.parse(text)
                            console.log(data);
                            //.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                            setEntries(data);
                        } catch (error) {
                            console.error('Failed to parse JSON:', error);
                            console.error('Response text:', text);
                        }
                    })
                    .catch(error => {
                        console.error('Fetch error:', error);
                    });
            } else {
                setEntries(null);
            }
        }

        fetchEntries();
    }, [user, setEntries]);




    console.log(entries);

    return(
        <div className="mx-2 my-1 ">
            <Title  title="Mes réservations" />

            {entries && entries.length > 0 ? (
                <ScrollShadow hideScrollBar >
                    <Table hideHeader aria-label="Entries listings" shadow="none">
                        <TableHeader>
                            <TableColumn>ressource</TableColumn>
                            <TableColumn>site</TableColumn>
                            <TableColumn>date de début</TableColumn>
                            <TableColumn>status</TableColumn>
                            <TableColumn>action</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {entries.map((entry, index)=>
                                (
                                    <TableRow key={index}>
                                        <TableCell>{entry.resource.name}</TableCell>
                                        <TableCell>{entry.resource.domains.name}</TableCell>
                                        <TableCell>{new Date(entry.startDate).toLocaleDateString('fr-FR', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        }) } à {
                                            new Date(entry.startDate).toLocaleTimeString('fr-FR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: false
                                        }).replace(':', 'h')}</TableCell>
                                        <TableCell>
                                            <Chip color="primary">{entry.status}</Chip>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-row">
                                                <Button size="sm" color="primary" className="mr-1" onClick={()=>console.log("Consulter fiche XX")}>
                                                    <EyeIcon className="h-5 w-5"/>
                                                </Button>
                                                <Button size="sm" color="danger" onClick={()=>console.log("Supprimer résa XX")}>
                                                    <TrashIcon className="h-5 w-5"/>
                                                </Button>
                                            </div>

                                        </TableCell>
                                    </TableRow>
                                )
                            )}
                        </TableBody>
                    </Table>
                </ScrollShadow>
            ) : (
                <div>
                    <h1 className="text-2xl text-center">Aucune réservation</h1>
                </div>
            )}
        </div>
    )


}