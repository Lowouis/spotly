import { Tooltip, useDisclosure } from "@nextui-org/react";
import { Button } from "@nextui-org/button";
import { ShieldExclamationIcon } from "@heroicons/react/24/solid";
import ModalValidBooking from "@/components/modals/ModalValidBooking";
import React, {useState} from "react";
import BlinkingDotText from "@/components/utils/BlinkingDotText";

export default function MatchingEntriesTable({resources, entry, session, handleRefresh}) {
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [currentResource, setCurrentResource] = useState(null); 

    return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full flex flex-col">
                {resources.length > 0 ? resources?.map((resource) => (
                    <div key={resource.id}
                         className="w-full shadow-md flex flex-col sm:flex-row justify-between items-center py-3 dark:bg-neutral-700 bg-neutral-50 p-1 rounded-lg mb-2">
                        <div className="flex flex-col sm:flex-row w-full mx-3 justify-between items-center">
                            <div className="text-xl font-normal w-full sm:w-1/3 mb-2 sm:mb-0">
                                <BlinkingDotText content={resource.name}/>
                            </div>
                            <div className="flex justify-end items-center w-full sm:w-1/3">
                                <Tooltip delay={25} radius="full" closeDelay={100} key={resource.id}
                                         content={resource.moderate ? "Un administrateur doit valider la réservation" : "Réserver cette ressource"}
                                         className=""
                                         color="foreground"
                                         showArrow={true}
                                >
                                    <Button
                                    size="lg"
                                    color="default"
                                    variant="flat"
                                    className={`bg-${resource.moderate ? 'blue' : 'green'}-500 text-white hover:bg-${resource.moderate ? 'blue' : 'green'}-700 hover:border-${resource.moderate ? 'blue' : 'green'}-700 transition duration-300 ease-in-out`}
                                    radius="sm"
                                    onPress={() => {
                                        setCurrentResource(resource);
                                        onOpen();
                                    }}
                                >
                                    <span className="text-xl">{!resource.moderate ? "Réserver" : "Demander"}</span>
                                </Button>
                                </Tooltip>
            
                                
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
                    entry={{...entry, resource: currentResource}}
                    onOpen={onOpen}
                    isOpen={isOpen}
                    onOpenChange={onOpenChange}
                    session={session}
            />
        </div>
    )}