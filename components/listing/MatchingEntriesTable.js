import { Tooltip, useDisclosure } from "@nextui-org/react";
import { Button } from "@nextui-org/button";
import { ShieldExclamationIcon } from "@heroicons/react/24/solid";
import ModalValidBooking from "@/components/modals/ModalValidBooking";
import React from "react";
import BlinkingDotText from "@/components/utils/BlinkingDotText";


export default function MatchingEntriesTable({resources, data, setData, setToast, session, handleRefresh, handleResetFetchedResources}) {
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    return (
        <div className="w-full flex justify-between items-center flex-col">

            <div className="w-full flex flex-col">
                {resources.length > 0 ? resources?.map((resource) => (
                    <div key={resource.id}
                         className="w-full flex justify-between items-center py-3 dark:bg-neutral-800  bg-neutral-50  p-1 rounded-lg mb-2">
                        <div className="flex flex-row w-full mx-3 items-center">
                            <div className="text-xl font-normal w-1/3">
                                <BlinkingDotText content={resource.name}/>
                            </div>
                            <div className="flex flex-row items-center justify-start w-1/3 space-x-4">
                                {resource.moderate && (
                                    <div className="">
                                        <Tooltip delay={25} radius="full" closeDelay={100} key={resource.id}
                                                 content="Un administrateur doit valider la réservation"
                                                 className=""
                                                 color="warning"
                                                 showArrow={true}
                                        >
                                            <Button size="lg" radius="full" color="default" isIconOnly variant="faded">
                                                <ShieldExclamationIcon className="w-6 h-6"/>
                                        </Button>
                                    </Tooltip>
                                </div>)
                                }

                            </div>
                            <div className="flex justify-end items-center w-1/3">
                                <Button
                                    className=""
                                    size="lg"
                                    color="primary"
                                    variant="solid"
                                    radius="sm"
                                    disableAnimation
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
                            <div className="h-full flex justify-center items-center mt-5 text-xl opacity-70">
                                Malheureusement, aucune ressource n&apos;est disponible avec ces critères
                            </div>
                        </div>
                        )}
                    </div>

                {/* MODAL */}
                <ModalValidBooking
                    handleRefresh={handleRefresh}
                    EntryData={data}
                    onOpen={onOpen}
                    isOpen={isOpen}
                    onOpenChange={onOpenChange}
                    session={session}
                    setToast={setToast}
                    handleResetFetchedResources={handleResetFetchedResources}
            />
        </div>
    )}