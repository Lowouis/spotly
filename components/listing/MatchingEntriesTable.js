import {Tooltip, useDisclosure} from "@heroui/react";
import {Button} from "@heroui/button";
import ModalValidBooking from "@/components/modals/ModalValidBooking";
import React, {useState} from "react";

export default function MatchingEntriesTable({resources, entry, session, handleRefresh}) {
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [currentResource, setCurrentResource] = useState(null);

    return (
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-0">
            {/* Liste des ressources */}
            <div className="w-full space-y-4">
                {resources.length > 0 ? resources?.map((resource) => (
                    <div key={resource.id}
                         className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-200">
                        <div
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                            {/* Informations de la ressource */}
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                                    {resource.name}
                                </h3>
                                {resource.description && (
                                    <p className="hidden sm:block text-sm text-neutral-600 dark:text-neutral-400">
                                        {resource.description}
                                    </p>
                                )}
                            </div>

                            {/* Bouton d'action */}
                            <div className="flex-shrink-0 flex justify-center sm:justify-end">
                                <Tooltip
                                    delay={25}
                                    radius="lg"
                                    closeDelay={100}
                                    content={resource.moderate ? "Un administrateur doit valider la réservation" : "Réserver cette ressource"}
                                    className="text-sm"
                                    color="foreground"
                                    placement="top"
                                    showArrow={true}
                                >
                                    <Button
                                        size="md"
                                        color="default"
                                        variant="flat"
                                        radius="md"
                                        className="w-full sm:w-auto h-11 px-6 font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200"
                                        onPress={() => {
                                            setCurrentResource(resource);
                                            onOpen();
                                        }}
                                    >
                                        <span className="text-sm">
                                            {!resource.moderate ? "Réserver" : "Demander"}
                                        </span>
                                    </Button>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div
                        className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-12">
                        <div className="text-center">
                            <div
                                className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33"/>
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                                Aucune ressource disponible
                            </h3>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                Malheureusement, aucune ressource n&apos;est disponible avec ces critères
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de réservation */}
            <ModalValidBooking
                handleRefresh={handleRefresh}
                entry={{...entry, resource: currentResource}}
                onOpen={onOpen}
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                session={session}
            />
        </div>
    );
}