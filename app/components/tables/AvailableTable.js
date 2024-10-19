import {ScrollShadow, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@nextui-org/react";
import {Button} from "@nextui-org/button";


export default function AvailableTable({}){


    return (
        <ScrollShadow hideScrollBar >
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
                    <TableColumn>Prochaine réservation</TableColumn>
                    <TableColumn>Action</TableColumn>
                </TableHeader>
                <TableBody >
                    <TableRow key="1">
                        <TableCell>LAPTOP11</TableCell>
                        <TableCell>
                            <span className="flex flex-col justify-center items-start">
                                <span>27/08/2024</span>
                                <span className="font-bold">12h00</span>
                            </span>
                        </TableCell>
                        <TableCell>
                            <Button className="w-full" size="small" color="success">Choisir</Button>
                        </TableCell>
                    </TableRow>

                </TableBody>
            </Table>
        </ScrollShadow>
    )
}