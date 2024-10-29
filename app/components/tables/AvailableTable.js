import {Tooltip, useDisclosure} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import {KeyIcon, ShieldExclamationIcon} from "@heroicons/react/24/solid";
import ModalValidBooking from "@/app/components/ModalValidBooking";
import React from "react";


export default function AvailableTable({resources, methods, data, setData, session}) {
    const {watch, setValue} = methods;

    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    return (
        <div className="w-full flex justify-between items-center">
            <div className="w-full flex flex-col">
                {resources.length > 0 ? resources?.map((resource) => (
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
                                    setData({...data, resourceId: resource.id});
                                }}
                            >
                                <span className="text-xl">Réserver</span>
                            </Button>
                        </div>
                    </div>

                )) : (
                    <div className="w-full flex justify-center items-center">
                        {/* A AJOUTER PLUS TARD ICI LES RESSOURCES NON DISPONIBLE AVEC LE NOM DE L'UTILISATEUR*/}
                        <div className="text-2xl font-semibold text-neutral-600">Aucune ressource disponible</div>
                    </div>
                )}
            </div>
            <ModalValidBooking data={data} onOpen={onOpen} isOpen={isOpen}  onOpenChange={onOpenChange} session={session}/>
        </div>
    )}