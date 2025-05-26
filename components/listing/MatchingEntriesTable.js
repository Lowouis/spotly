import {Tooltip, useDisclosure} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import ModalValidBooking from "@/components/modals/ModalValidBooking";
import React, {useState} from "react";
import BlinkingDotText from "@/components/utils/BlinkingDotText";

export default function MatchingEntriesTable({resources, entry, session, handleRefresh}) {
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [currentResource, setCurrentResource] = useState(null);
    return (
        <div className="mx-auto w-[90%]">
            <div className="w-full flex flex-col space-y-3">
                {resources.length > 0 ? resources?.map((resource) => (
                    <div key={resource.id}
                         className="w-full flex flex-col sm:flex-row justify-between items-center py-4 dark:bg-neutral-800/80 bg-neutral-50 px-4 rounded-xl">
                        <div className="flex flex-col sm:flex-row w-full justify-between items-center gap-4">
                            <div
                                className="text-xl font-medium w-full sm:w-1/3 text-center sm:text-left text-neutral-700 dark:text-neutral-200">
                                <BlinkingDotText content={resource.name}/>
                            </div>
                            <div className="flex justify-center sm:justify-end items-center w-full sm:w-1/3">
                                <Tooltip
                                    delay={25}
                                    radius="lg"
                                    closeDelay={100}
                                    content={resource.moderate ? "Un administrateur doit valider la réservation" : "Réserver cette ressource"}
                                    className="text-sm"
                                    color="foreground"
                                    placement="top-end"
                                    showArrow={true}
                                >
                                    <Button
                                        size="lg"
                                        color="default"
                                        variant="flat"
                                        radius="sm"
                                        className="w-full sm:w-auto px-6 min-w-[140px] font-medium"
                                        onPress={() => {
                                            setCurrentResource(resource);
                                            onOpen();
                                        }}
                                    >
                                        <span className="text-lg">{!resource.moderate ? "Réserver" : "Demander"}</span>
                                    </Button>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="w-full flex justify-center items-center py-12">
                        <div className="text-center text-lg md:text-xl text-neutral-500 dark:text-neutral-400">
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