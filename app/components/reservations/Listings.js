import {useEffect, useState} from "react";
import Title from "@/app/components/utils/title";
import {Accordion, AccordionItem} from "@nextui-org/react";


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

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }) +" "+new Date(date).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(':', 'h')

    }

    return(
        <div className="mx-2 my-1 lg:w-1/3 lg:flex lg:flex-col md:w-full lg:items-start lg:justify-start">
            <Title  title="Mes réservations" />
            {entries && entries.length > 0 ? (
                <Accordion>
                    {entries.map(entry=> (
                        <AccordionItem
                            startContent="A"
                            variant="bordered" key={entry.id} aria-label="Accordion 1" title={entry.resource.name}>
                            <div className="flex-row flex w-full">
                                <div className="flex w-1/5 flex-col">
                                    <div className="">
                                        <span className="font-bold mr-1">Début</span>
                                    </div>
                                    <div className="flex w-1/2">
                                        <span className="font-bold mr-1">Fin</span>
                                    </div>
                                </div>
                                <div className="flex flex-col w-3/5">
                                    <div className="flex flex-row">{formatDate(entry.startDate)}</div>
                                    <div className="flex flex-row">{formatDate(entry.endDate)}</div>
                                </div>
                            </div>

                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <div>
                    <h1 className="text-2xl text-center">Aucune réservation</h1>
                </div>
            )}
        </div>
    )


}
/*

<ScrollShadow hideScrollBar >
    <Table hideHeader aria-label="Entries listings" shadow="none">
        <TableHeader>
            <TableColumn>ressource</TableColumn>
            <TableColumn>date de début</TableColumn>
            <TableColumn>action</TableColumn>
        </TableHeader>
        <TableBody>
            {entries.map((entry, index)=>
                (
                    <TableRow key={index}>
                        <TableCell>{entry.resource.name}</TableCell>
                        <TableCell >
                            <Tooltip content={formatDate(entry.endDate)} color="danger">
                                <Button color="primary">
                                    { new Date(entry.startDate).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    }) }
                                    <Chip color="default">
                                        {
                                            new Date(entry.startDate).toLocaleTimeString('fr-FR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: false
                                            }).replace(':', 'h')}
                                    </Chip>
                                </Button>
                            </Tooltip>

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
</ScrollShadow>*/
