import {Tooltip, useDisclosure} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import {KeyIcon, ShieldExclamationIcon} from "@heroicons/react/24/solid";
import ModalValidBooking from "@/app/components/ModalValidBooking";
import React from "react";


export default function AvailableTable({resources, methods, setSummary, data}) {
    const {watch, setValue} = methods;
    const defaultContent =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
    const setSelectedResource = (resource) => {
        setValue('resource', resource);
        setSummary(true);
    }
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    return (
        <div className="w-full flex justify-between items-center">
            <div className="w-full flex flex-col">
                {resources?.map((resource) => (
                    <div key={resource.id}  className="w-full flex justify-between items-center py-3 bg-neutral-50 hover:bg-neutral-100 p-1 rounded-lg mb-2">
                        <div className="flex flex-row space-x-6 mx-3 items-center">
                            <div className="text-xl font-normal">
                                {resource.name}
                            </div>
                            <div className="flex flex-row space-x-2">
                                <div className="">
                                    <Tooltip  delay={25} closeDelay={100} key={resource.id}
                                             content="Vous aurez besoin d'une clef"
                                             className="capitalize"
                                              color="default"
                                              showArrow={true}

                                    >
                                        <Button radius="full" size="lg" color="success" isIconOnly variant="flat">
                                            <KeyIcon className="w-6 h-6" color="grey"/>
                                        </Button>
                                    </Tooltip>
                                </div>
                                <div className="">
                                    <Tooltip delay={25} radius="full" closeDelay={100} key={resource.id}
                                             content="Un administrateur doit valider la réservation"
                                             className="capitalize"
                                             color="default"
                                             showArrow={true}
                                    >
                                        <Button size="lg" radius="full" color="danger" isIconOnly variant="flat">
                                            <ShieldExclamationIcon className="w-6 h-6" color="grey"/>
                                        </Button>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                        <div>
                            <Button
                                className=""
                                size="lg"
                                color="default"
                                variant="ghost"
                                onClick={()=> {
                                    onOpen();
                                    setSelectedResource(resource);
                                }}
                            >
                                <span className="text-xl">Réserver</span>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
            <ModalValidBooking data={data} onOpen={onOpen} isOpen={isOpen}  onOpenChange={onOpenChange} />
        </div>
    )}