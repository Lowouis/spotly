import {
    Accordion, AccordionItem,
    ScrollShadow,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow, Tooltip
} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import {KeyIcon, ShieldExclamationIcon} from "@heroicons/react/24/solid";


export default function AvailableTable({resources, methods, setSummary}) {
    const {watch, setValue} = methods;
    const defaultContent =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
    const setSelectedResource = (resource) => {
        setValue('resource', resource);
        setSummary(true);
    }

    return (
        <div className="w-full flex justify-between items-center">
            <div className="w-full flex flex-col">
                {resources?.map((resource) => (
                    <div key={resource.id}  className="w-full flex justify-between items-center py-3 bg-neutral-50 hover:bg-neutral-100 p-1 rounded-lg mb-2">
                        <div className="flex flex-row space-x-6 mx-3 items-center">
                            <div className="text-xl font-bold">
                                {resource.name}
                            </div>
                            <div className="flex flex-row space-x-2">
                                <div className="">
                                    <Tooltip  delay={50} closeDelay={100} key={resource.id}
                                             content={
                                                 <div className="px-1 py-2 w-auto">
                                                     <div className="text-small font-medium">Vous aurez besoin d'une clef</div>
                                                 </div>
                                             }
                                             className="capitalize"
                                             color="default">
                                        <Button radius="full" size="lg" color="success" isIconOnly variant="flat">
                                            <KeyIcon className="w-6 h-6" color="black"/>
                                        </Button>
                                    </Tooltip>
                                </div>
                                <div className="">
                                    <Tooltip delay={50} radius="full" closeDelay={100} key={resource.id}
                                             content={
                                                 <div className="px-1 py-2 w-auto">
                                                     <div className="text-small font-medium">Un administrateur doit valider la réservation</div>
                                                 </div>
                                             }
                                             className="capitalize"
                                             color="default"
                                    >
                                        <Button size="lg" radius="full" color="danger" isIconOnly variant="flat">
                                            <ShieldExclamationIcon className="w-6 h-6" color="black"/>
                                        </Button>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                        <div>
                            <Button
                                className="block"
                                size="lg"
                                color="default"
                                variant="ghost"
                                onClick={() => setSelectedResource(resource.id)}
                            >
                                <span className="text-xl">Réserver</span>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )}