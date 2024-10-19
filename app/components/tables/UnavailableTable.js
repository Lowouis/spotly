import {ScrollShadow, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@nextui-org/react";


export default function UnavailableTable({}){


    return (
        <ScrollShadow hideScrollBar >
            <Table
                aria-label="Unavailable Table"
                className="w-full overflow-y-scroll no-scrollbar"
                isStriped
                color="primary"
                selectionMode="single"
                shadow="none"
                >
                <TableHeader>
                    <TableColumn>Ressource</TableColumn>
                    <TableColumn>Utilisateur</TableColumn>
                    <TableColumn>Début</TableColumn>
                    <TableColumn>Fin</TableColumn>
                </TableHeader>
                <TableBody >
                    <TableRow key="1">
                        <TableCell>LAPTOP10</TableCell>
                        <TableCell>Louis GURITA</TableCell>
                        <TableCell>
                            <span className="flex flex-col justify-center items-start">
                                <span>27/08/2024</span>
                                <span className="font-bold">12h00</span>
                            </span>
                        </TableCell>
                        <TableCell>
                           <span className="flex flex-col justify-center items-start">
                                <span>28/08/2024</span>
                                <span className="font-bold">12h00</span>
                            </span>
                        </TableCell>
                    </TableRow>
                    <TableRow key="2">
                        <TableCell>LAPTOP10</TableCell>
                        <TableCell>Louis GURITA</TableCell>
                        <TableCell>
                            <span className="flex flex-col justify-center items-start">
                                <span>27/08/2024</span>
                                <span className="font-bold">12h00</span>
                            </span>
                        </TableCell>
                        <TableCell>
                           <span className="flex flex-col justify-center items-start">
                                <span>28/08/2024</span>
                                <span className="font-bold">12h00</span>
                            </span>
                        </TableCell>
                    </TableRow>
                    <TableRow key="3">
                        <TableCell>LAPTOP10</TableCell>
                        <TableCell>Louis GURITA</TableCell>
                        <TableCell>
                            <span className="flex flex-col justify-center items-start">
                                <span>27/08/2024</span>
                                <span className="font-bold">12h00</span>
                            </span>
                        </TableCell>
                        <TableCell>
                           <span className="flex flex-col justify-center items-start">
                                <span>28/08/2024</span>
                                <span className="font-bold">12h00</span>
                            </span>
                        </TableCell>
                    </TableRow>
                    <TableRow key="4">
                        <TableCell>LAPTOP10</TableCell>
                        <TableCell>Louis GURITA</TableCell>
                        <TableCell>
                            <span className="flex flex-col justify-center items-start">
                                <span>27/08/2024</span>
                                <span className="font-bold">12h00</span>
                            </span>
                        </TableCell>
                        <TableCell>
                           <span className="flex flex-col justify-center items-start">
                                <span>28/08/2024</span>
                                <span className="font-bold">12h00</span>
                            </span>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </ScrollShadow>
    )
}