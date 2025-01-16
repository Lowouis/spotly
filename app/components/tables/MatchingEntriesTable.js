import {Alert, Tooltip, useDisclosure} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import { ShieldExclamationIcon} from "@heroicons/react/24/solid";
import ModalValidBooking from "@/app/components/modals/ModalValidBooking";
import React, {useState} from "react";
import BlinkingDotText from "@/app/components/utils/BlinkingDotText";


export default function MatchingEntriesTable({resources, data, setData, session, handleRefresh, handleResetFetchedResources}) {
    const [push, setPush] = useState(false);
    const [toast, setToast ] = useState({title: "", description: "", type: ""});
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    return (
        <div className="w-full flex justify-between items-center flex-col">
            {/* USER TOAST */}
            {toast.title !== "" && (
                <div className="flex items-center justify-center w-full mb-5">
                    <Alert description={toast.description} title={toast.title} color={toast.type} variant="solid" radius="md"  isClosable={true}/>
                </div>
            )}
            <div className="w-full flex flex-col">
                {resources.length > 0 ? resources?.map((resource) => (
                    <div key={resource.id}  className="w-full flex justify-between items-center py-3 bg-neutral-50 hover:bg-neutral-100 p-1 rounded-lg mb-2">
                        <div className="flex flex-row w-full mx-3 items-center">
                            <div className="text-xl font-normal w-1/3">
                                <BlinkingDotText content={resource.name} color={resource.status==="AVAILABLE" ? "green" : "red"}/>
                            </div>
                            <div className="flex flex-row items-center justify-start w-1/3 space-x-4">
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
                                    onPress={() => {
                                        onOpen();
                                        setData({...data, resource: resource});
                                    }}
                                >
                                    <span className="text-xl">{!resource.moderate ? "Réserver" : "Demander"}</span>
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

            {/* MODAL */}
            <ModalValidBooking
                handleRefresh={handleRefresh}
                data={data}
                onOpen={onOpen}
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                session={session}
                setPush={setPush}
                setToast={setToast}
                handleResetFetchedResources={handleResetFetchedResources}
            />
        </div>
    )}