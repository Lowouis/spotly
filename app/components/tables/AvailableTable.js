import {
    Accordion, AccordionItem,
    ScrollShadow,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow
} from "@nextui-org/react";
import {Button} from "@nextui-org/button";


export default function AvailableTable({resources, methods, setSummary}) {
    const {watch, setValue} = methods;
    const defaultContent =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
    const setSelectedResource = (resource) => {
        setValue('resource', resource);
        setSummary(true);
    }

    return (
        <div style={{width: '100%'}}>
            <ScrollShadow hideScrollBar width={100}>
                <Table
                    aria-label="Unavailable Table"
                    className="overflow-y-scroll no-scrollbar "
                    isStriped
                    color="primary"
                    shadow="none"
                    hideHeader={true}
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
                                    <Button
                                        className="w-full"
                                        size="small"
                                        color="primary"
                                        onClick={()=>setSelectedResource(resource.id)}
                                    >
                                        Choisir
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

            </ScrollShadow>
        </div>
            )

        }