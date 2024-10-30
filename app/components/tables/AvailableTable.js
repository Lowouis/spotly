import {Tooltip, useDisclosure} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import {KeyIcon, ShieldExclamationIcon} from "@heroicons/react/24/solid";
import ModalValidBooking from "@/app/components/ModalValidBooking";
import React, {useState} from "react";


export default function AvailableTable({resources, methods, data, setData, session}) {
    const {watch, setValue} = methods;
    const [push, setPush] = useState(false);
    const {isOpenMailConfirmation, onOpenMailConfirmation, onOpenChangeMailConfirmation} = useDisclosure();
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    return (
        <div className="w-full flex justify-between items-center">
            <div className="w-full flex flex-col">
                {resources.length > 0 ? resources?.map((resource) => (
                    <div key={resource.id}  className="w-full flex justify-between items-center py-3 bg-neutral-50 hover:bg-neutral-100 p-1 rounded-lg mb-2">
                        <div className="flex flex-row w-full mx-3 items-center">
                            <div className="text-xl font-normal w-1/3">
                                {resource.name}
                            </div>
                            <div className="flex flex-row items-center justify-start w-1/3 space-x-4">
                                {/*<div className="">
                                    <Tooltip delay={25} closeDelay={100} key={resource.id}
                                             content="Vous aurez besoin d'une clef"
                                             className=""
                                             color="default"
                                             showArrow={true}

                                    >
                                        <Button radius="full" size="lg" color="success" isIconOnly variant="flat">
                                            <KeyIcon className="w-6 h-6" color="grey"/>
                                        </Button>
                                    </Tooltip>
                                </div>*/}
                                {resource.moderate && (<div className="">
                                    <Tooltip delay={25} radius="full" closeDelay={100} key={resource.id}
                                             content="Un administrateur doit valider la réservation"
                                             className=""
                                             color="default"
                                             showArrow={true}
                                    >
                                        <Button size="lg" radius="full" color="danger" isIconOnly variant="flat">
                                            <ShieldExclamationIcon className="w-6 h-6" color="grey"/>
                                        </Button>
                                    </Tooltip>
                                </div>)}

                            </div>
                            <div className="flex justify-end items-center w-1/3">
                                <Button
                                    className=""
                                    size="lg"
                                    color="primary"
                                    variant="flat"
                                    onClick={() => {
                                        onOpen();
                                        setData({...data, resource: resource});
                                    }}
                                >
                                    <span className="text-xl">Réserver</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                )) : (
                    <div className="w-full flex justify-center items-center">
                        {/* A AJOUTER PLUS TARD ICI LES RESSOURCES NON DISPONIBLE AVEC LE NOM DE L'UTILISATEUR*/}
                        <div className="text-2xl font-semibold text-neutral-600">Aucune ressource disponible</div>
                    </div>
                )}
            </div>
            <ModalValidBooking data={data} setData={setData} onOpen={onOpen} isOpen={isOpen}  onOpenChange={onOpenChange} session={session} setPush={setPush} push={push}/>
        </div>
    )}