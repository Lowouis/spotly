import {Button} from "@/components/ui/button";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import ModalValidBooking from "@/components/modals/ModalValidBooking";
import React, {useState} from "react";
import {
    ArrowRightIcon,
    BuildingOffice2Icon,
    ClockIcon,
    ListBulletIcon,
    StarIcon,
} from "@heroicons/react/24/outline";
import {getCategoryIcon} from "@/lib/category-icons";

export default function MatchingEntriesTable({resources, entry, session, handleRefresh}) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentResource, setCurrentResource] = useState(null);
    const startDate = entry?.date?.start ? new Date(entry.date.start) : null;
    const endDate = entry?.date?.end ? new Date(entry.date.end) : null;
    const timeRange = startDate && endDate
        ? `${startDate.toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"})} - ${endDate.toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"})}`
        : "Horaire à définir";
    const durationLabel = startDate && endDate
        ? `${Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))} jour${Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) > 1 ? "s" : ""}`
        : "Durée à définir";

    const openBookingModal = (resource) => {
        setCurrentResource(resource);
        setIsOpen(true);
    };

    const ResourceVisual = ({resource}) => {
        const {Icon} = getCategoryIcon(resource?.category?.iconKey);

        return (
            <div className="flex h-28 w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#f8fafc] to-[#e8eef6] text-[#64748b] shadow-inner sm:h-32 sm:w-44">
                {resource?.category?.iconSvg ? <span className="h-12 w-12" dangerouslySetInnerHTML={{__html: resource.category.iconSvg}} /> : <Icon className="h-12 w-12" />}
            </div>
        );
    };

    return (
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-0">
            <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-black text-[#111827] dark:text-neutral-100 md:text-3xl">Ressources disponibles</h2>
                        <span className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-black text-red-500">{resources.length} résultat{resources.length > 1 ? "s" : ""}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-[#6b7585] dark:text-neutral-400 md:text-base">Sélectionnez la ressource qui correspond le mieux à vos besoins.</p>
                </div>

            </div>

            <div className="w-full space-y-3">
                {resources.length > 0 ? resources?.map((resource) => (
                    <div key={resource.id}
                         className="w-full rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950">
                        <div className="grid gap-5 xl:grid-cols-[minmax(420px,1.4fr)_minmax(260px,0.7fr)_minmax(200px,0.55fr)_260px] xl:items-center">
                            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                                <ResourceVisual resource={resource} />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="truncate text-xl font-black text-[#111827] dark:text-neutral-100">{resource.name}</h3>
                                        <StarIcon className="h-5 w-5 shrink-0 text-[#7b8798]" />
                                    </div>
                                    <p className="mt-4 line-clamp-2 text-sm font-medium leading-6 text-[#6b7585] dark:text-neutral-400">
                                        {resource.description || "Ressource disponible pour votre réservation."}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 border-[#edf1f6] text-sm dark:border-neutral-800 xl:border-l xl:pl-5">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500"><ListBulletIcon className="h-5 w-5" /></span>
                                    <span className="min-w-0"><span className="block text-xs font-bold text-[#8a94a6]">Catégorie</span><span className="block truncate font-bold text-[#4b5563] dark:text-neutral-300">{resource.category?.name || "Non définie"}</span></span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><BuildingOffice2Icon className="h-5 w-5" /></span>
                                    <span className="min-w-0"><span className="block text-xs font-bold text-[#8a94a6]">Site</span><span className="block truncate font-bold text-[#4b5563] dark:text-neutral-300">{resource.domains?.name || "Non défini"}</span></span>
                                </div>
                            </div>

                            <div className="space-y-3 border-[#edf1f6] text-sm font-bold text-[#6b7585] dark:border-neutral-800 dark:text-neutral-400 xl:border-l xl:pl-5">
                                <span className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 ${resource.moderate ? "bg-orange-50 text-orange-500" : "bg-emerald-50 text-emerald-600"}`}>
                                    <span className={`h-2.5 w-2.5 rounded-full ${resource.moderate ? "bg-orange-500" : "bg-emerald-500"}`} />
                                    {resource.moderate ? "Sous réserve" : "Disponible"}
                                </span>
                                <div className="flex items-center gap-3"><ClockIcon className="h-5 w-5" />{timeRange}</div>
                                <div className="flex items-center gap-3"><ClockIcon className="h-5 w-5" />{durationLabel}</div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <TooltipProvider delayDuration={25}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                className="h-12 w-full rounded-xl bg-red-500 text-base font-black text-white shadow-sm transition-colors duration-200 hover:bg-red-600"
                                                onClick={() => openBookingModal(resource)}
                                            >
                                                {!resource.moderate ? "Réserver" : "Demander"}
                                                <ArrowRightIcon className="h-5 w-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {resource.moderate ? "Un administrateur doit valider la réservation" : "Réserver cette ressource"}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <Button type="button" variant="outline" onClick={() => openBookingModal(resource)} className="h-12 w-full rounded-xl border-[#dfe6ee] bg-white text-base font-bold text-[#3f4652] hover:bg-[#f8fafc] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
                                    Voir les détails
                                </Button>
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
                isOpen={isOpen}
                onOpenChange={setIsOpen}
                session={session}
            />
        </div>
    );
}
