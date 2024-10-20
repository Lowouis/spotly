import {ScrollShadow, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@nextui-org/react";
import {Button} from "@nextui-org/button";


export default function AvailableTable({resources}) {


    return (
        <ScrollShadow hideScrollBar width={100}>
            <Table
                aria-label="Unavailable Table"
                className="overflow-y-scroll no-scrollbar w-full h-full"
                isStriped
                fullWidth={true}
                color="primary"
                selectionMode="single"
                shadow="none"
                width={100}
            >
                <TableHeader>
                    <TableColumn>Ressource</TableColumn>
                    <TableColumn>Action</TableColumn>
                </TableHeader>
                <TableBody>
                    {resources?.map((resource) => (
                        <TableRow key={resource.id}>
                            <TableCell>{resource.name}</TableCell>
                            <TableCell>
                                <Button className="w-full" size="small" color="success">Choisir</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollShadow>
    )
}