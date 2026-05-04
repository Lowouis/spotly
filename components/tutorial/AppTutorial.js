'use client';

import React, {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    BookmarkIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ClipboardDocumentCheckIcon,
    ChatBubbleLeftRightIcon,
    CubeIcon,
    ExclamationTriangleIcon,
    HomeIcon,
    KeyIcon,
    MagnifyingGlassIcon,
    PlayCircleIcon
} from '@heroicons/react/24/outline';

const steps = [
    {
        title: 'Présentation de Mon espace',
        description: 'Retrouvez vos raccourcis, vos favoris, vos prochaines réservations et vos messages au même endroit.',
        icon: HomeIcon,
        tab: 'home',
        action: 'Ouvrir Mon espace',
        bullets: ['Vos ressources favorites restent accessibles en un clic.', 'Vos prochaines réservations sont visibles immédiatement.', 'Les messages liés aux réservations apparaissent dans le panneau de droite.'],
        preview: 'home'
    },
    {
        title: 'Réserver une ressource',
        description: 'Passez par Rechercher, choisissez le site, la catégorie, la ressource souhaitée puis le créneau.',
        icon: MagnifyingGlassIcon,
        tab: 'search',
        action: 'Commencer une réservation',
        bullets: ['Sélectionnez d’abord le site.', 'Choisissez une catégorie puis éventuellement une ressource précise.', 'Validez la période pour afficher les disponibilités et réserver.'],
        preview: 'search'
    },
    {
        title: 'Consulter sa réservation',
        description: 'La section Réservations regroupe vos demandes en attente, confirmées, en cours ou terminées.',
        icon: BookmarkIcon,
        tab: 'bookings',
        action: 'Voir mes réservations',
        bullets: ['Ouvrez le détail pour consulter le statut.', 'Retrouvez les dates, la ressource, le site et les actions disponibles.', 'Annulez ou modifiez quand la réservation le permet.'],
        preview: 'bookings'
    },
    {
        title: 'Signaler un problème et suivre les messages',
        description: 'Depuis une réservation ou une ressource concernée, vous pouvez signaler un problème. Les échanges liés aux signalements et aux réservations en attente sont ensuite regroupés dans Messages, sur Mon espace.',
        icon: ChatBubbleLeftRightIcon,
        tab: 'home',
        action: 'Voir mes messages',
        bullets: ['Signalez un problème si la ressource est abîmée, indisponible ou non conforme.', 'Les discussions liées aux signalements restent accessibles dans Messages.', 'Les échanges autour d’une réservation en attente de confirmation apparaissent aussi dans Messages.'],
        preview: 'messages'
    },
    {
        title: 'Récupérer la ressource',
        description: 'Au moment prévu, ouvrez la réservation. Spotly vous indique si un code est nécessaire ou si la récupération est directe.',
        icon: KeyIcon,
        tab: 'bookings',
        action: 'Aller aux réservations',
        bullets: ['Avec code : demandez le code puis saisissez-le dans la réservation.', 'Sans code : confirmez simplement la récupération quand le bouton est disponible.', 'Si la récupération est bloquée, un message explique la raison.'],
        preview: 'pickup'
    },
    {
        title: 'Restituer la ressource',
        description: 'En fin d’utilisation, ouvrez la réservation et confirmez la restitution, avec ou sans code selon le niveau de contrôle.',
        icon: ClipboardDocumentCheckIcon,
        tab: 'bookings',
        action: 'Gérer une restitution',
        bullets: ['Avec code : saisissez le code de restitution demandé.', 'Sans code : cliquez sur Restituer pour clôturer.', 'La réservation passe ensuite en état terminé/restitué.'],
        preview: 'return'
    }
];

const PreviewShell = ({children}) => (
    <div className="relative overflow-hidden rounded-3xl border border-[#dfe6ee] bg-[#f7f9fc] p-4 shadow-inner dark:border-neutral-800 dark:bg-neutral-900">
        <div className="absolute right-5 top-5 flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="spotly-tutorial-scene min-h-[300px] rounded-2xl bg-white p-4 dark:bg-neutral-950">
            {children}
        </div>
    </div>
);

const Cursor = ({className = ''}) => (
    <span className={`spotly-tutorial-cursor absolute z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#ff2a2f] text-xs font-black text-white shadow-xl shadow-red-500/30 ${className}`}>
        ↗
    </span>
);

const HomePreview = () => (
    <PreviewShell>
        <div className="space-y-4">
            <div>
                <div className="h-4 w-36 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                <div className="mt-2 h-3 w-52 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="spotly-tutorial-card rounded-2xl border border-red-100 bg-red-50 p-4 dark:border-red-950 dark:bg-red-950/20">
                    <CubeIcon className="h-7 w-7 text-[#ff2a2f]" />
                    <div className="mt-5 h-3 w-28 rounded-full bg-red-200 dark:bg-red-900" />
                    <div className="mt-2 h-2 w-20 rounded-full bg-red-100 dark:bg-red-950" />
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-950 dark:bg-blue-950/20">
                    <CalendarDaysIcon className="h-7 w-7 text-blue-600" />
                    <div className="mt-5 h-3 w-24 rounded-full bg-blue-200 dark:bg-blue-900" />
                    <div className="mt-2 h-2 w-32 rounded-full bg-blue-100 dark:bg-blue-950" />
                </div>
            </div>
            <div className="rounded-2xl border border-[#dfe6ee] p-4 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                    <div className="h-3 w-36 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                    <div className="h-3 w-14 rounded-full bg-[#ff2a2f]" />
                </div>
                <div className="mt-4 space-y-3">
                    {[0, 1].map((item) => <div key={item} className="h-10 rounded-xl bg-neutral-100 dark:bg-neutral-900" />)}
                </div>
            </div>
        </div>
        <Cursor className="right-10 top-24" />
    </PreviewShell>
);

const SearchPreview = () => (
    <PreviewShell>
        <div className="space-y-5">
            <div className="grid grid-cols-4 gap-2">
                {['Site', 'Catégorie', 'Ressource', 'Date'].map((label, index) => (
                    <div key={label} className="text-center">
                        <span className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${index < 3 ? 'bg-[#ff2a2f] text-white' : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'}`}>{index + 1}</span>
                        <span className="mt-1 block text-[10px] font-bold text-neutral-500">{label}</span>
                    </div>
                ))}
            </div>
            <div className="rounded-2xl border border-[#dfe6ee] p-4 dark:border-neutral-800">
                <div className="h-3 w-28 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="h-12 rounded-xl bg-neutral-100 dark:bg-neutral-900" />
                    <div className="h-12 rounded-xl bg-neutral-100 dark:bg-neutral-900" />
                </div>
                <button type="button" className="mt-4 h-11 rounded-xl bg-[#ff2a2f] px-5 text-sm font-black text-white">Afficher les disponibilités</button>
            </div>
            <div className="spotly-tutorial-card flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-950 dark:bg-emerald-950/20">
                <div>
                    <div className="h-3 w-32 rounded-full bg-emerald-700 dark:bg-emerald-300" />
                    <div className="mt-2 h-2 w-44 rounded-full bg-emerald-200 dark:bg-emerald-900" />
                </div>
                <span className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white">Réserver</span>
            </div>
        </div>
        <Cursor className="bottom-8 right-12" />
    </PreviewShell>
);

const BookingsPreview = () => (
    <PreviewShell>
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="h-4 w-32 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">Confirmée</span>
            </div>
            {[0, 1, 2].map((item) => (
                <div key={item} className={`rounded-2xl border p-4 ${item === 0 ? 'spotly-tutorial-card border-red-100 bg-red-50 dark:border-red-950 dark:bg-red-950/20' : 'border-[#dfe6ee] bg-white dark:border-neutral-800 dark:bg-neutral-950'}`}>
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="h-3 w-36 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                            <div className="mt-2 h-2 w-52 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                        </div>
                        <span className="rounded-lg border border-[#dfe6ee] px-3 py-2 text-xs font-black dark:border-neutral-800">Détails</span>
                    </div>
                </div>
            ))}
        </div>
        <Cursor className="right-8 top-28" />
    </PreviewShell>
);

const MessagesPreview = () => (
    <PreviewShell>
        <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr]">
            <div className="space-y-3">
                <div className="h-4 w-24 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                <div className="spotly-tutorial-card rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-950 dark:bg-amber-950/20">
                    <div className="flex items-center gap-3">
                        <ExclamationTriangleIcon className="h-7 w-7 text-amber-600" />
                        <div>
                            <div className="h-3 w-32 rounded-full bg-amber-700 dark:bg-amber-300" />
                            <div className="mt-2 h-2 w-40 rounded-full bg-amber-200 dark:bg-amber-900" />
                        </div>
                    </div>
                    <span className="mt-4 inline-flex rounded-lg bg-amber-600 px-3 py-2 text-xs font-black text-white">Signaler</span>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-950 dark:bg-blue-950/20">
                    <div className="h-3 w-36 rounded-full bg-blue-700 dark:bg-blue-300" />
                    <div className="mt-2 h-2 w-28 rounded-full bg-blue-200 dark:bg-blue-900" />
                </div>
            </div>
            <div className="rounded-2xl border border-[#dfe6ee] bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-[#ff2a2f]" />
                        <div className="h-3 w-20 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                    </div>
                    <span className="rounded-full bg-[#fff1f1] px-2 py-1 text-[10px] font-black text-[#d71920]">2 nouveaux</span>
                </div>
                <div className="mt-4 space-y-3">
                    <div className="rounded-xl bg-neutral-100 p-3 dark:bg-neutral-900">
                        <div className="h-2.5 w-36 rounded-full bg-neutral-600 dark:bg-neutral-300" />
                        <div className="mt-2 h-2 w-48 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                    </div>
                    <div className="rounded-xl bg-[#fff1f1] p-3 dark:bg-red-950/20">
                        <div className="h-2.5 w-44 rounded-full bg-[#d71920]" />
                        <div className="mt-2 h-2 w-36 rounded-full bg-red-200 dark:bg-red-900" />
                    </div>
                    <div className="ml-auto h-9 w-28 rounded-xl bg-[#ff2a2f]" />
                </div>
            </div>
        </div>
        <Cursor className="right-10 top-32" />
    </PreviewShell>
);

const ControlPreview = ({mode}) => (
    <PreviewShell>
        <div className="space-y-4">
            <div className="rounded-2xl border border-[#dfe6ee] p-4 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">1</span>
                    <div>
                        <div className="h-3 w-40 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                        <div className="mt-2 h-2 w-56 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                    </div>
                </div>
            </div>
            <div className="spotly-tutorial-card rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-950 dark:bg-blue-950/20">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-black text-blue-800 dark:text-blue-200">
                            <KeyIcon className="h-5 w-5" />
                            {mode === 'pickup' ? 'Récupération' : 'Restitution'} avec code
                        </div>
                        <div className="mt-3 flex gap-2">
                            {['', '', '', ''].map((_, index) => <span key={index} className="h-10 w-10 rounded-lg border border-blue-200 bg-white dark:border-blue-900 dark:bg-neutral-950" />)}
                        </div>
                    </div>
                    <button type="button" className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white">Valider</button>
                </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-950 dark:bg-emerald-950/20">
                <div className="flex items-center gap-3">
                    <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
                    <div>
                        <div className="text-sm font-black text-emerald-800 dark:text-emerald-200">Sans code</div>
                        <div className="text-xs font-semibold text-emerald-700/70 dark:text-emerald-300/70">Confirmation directe disponible</div>
                    </div>
                </div>
                <span className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white">Confirmer</span>
            </div>
        </div>
        <Cursor className="bottom-28 right-14" />
    </PreviewShell>
);

const renderPreview = (preview) => {
    if (preview === 'home') return <HomePreview />;
    if (preview === 'search') return <SearchPreview />;
    if (preview === 'bookings') return <BookingsPreview />;
    if (preview === 'messages') return <MessagesPreview />;
    if (preview === 'pickup') return <ControlPreview mode="pickup" />;
    return <ControlPreview mode="return" />;
};

export default function AppTutorial({open, onOpenChange, onNavigate, onComplete}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentStep = steps[currentIndex];
    const Icon = currentStep.icon;
    const isFirstStep = currentIndex === 0;
    const isLastStep = currentIndex === steps.length - 1;

    useEffect(() => {
        if (open) setCurrentIndex(0);
    }, [open]);

    const handleNavigate = () => {
        onNavigate?.(currentStep.tab);
        onOpenChange(false);
    };

    const handleComplete = () => {
        onComplete?.();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-[#dfe6ee] bg-white p-0 text-[#111827] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 sm:max-w-5xl" hideCloseButton={false}>
                <div className="grid min-h-[620px] md:grid-cols-[minmax(0,1fr)_380px]">
                    <section className="p-5 md:p-8">
                        <DialogHeader className="static bg-transparent pr-10 text-left">
                            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-[#fff1f1] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#d71920] dark:bg-red-950/30 dark:text-red-200">
                                <PlayCircleIcon className="h-4 w-4" />
                                Tutoriel Spotly
                            </div>
                            <DialogTitle className="text-2xl font-black md:text-3xl">{currentStep.title}</DialogTitle>
                            <DialogDescription className="mt-3 max-w-2xl text-base leading-7 text-[#5f6b7a] dark:text-neutral-400">
                                {currentStep.description}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-6">
                            {renderPreview(currentStep.preview)}
                        </div>
                    </section>

                    <aside className="border-t border-[#dfe6ee] bg-[#fbfcff] p-5 dark:border-neutral-800 dark:bg-neutral-900/50 md:border-l md:border-t-0 md:p-8">
                        <div className="flex items-center gap-3">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff2a2f] text-white shadow-lg shadow-red-500/25">
                                <Icon className="h-6 w-6" />
                            </span>
                            <div>
                                <p className="text-xs font-black uppercase tracking-wide text-[#8a96a8] dark:text-neutral-500">Étape {currentIndex + 1} / {steps.length}</p>
                                <p className="text-base font-black text-[#111827] dark:text-neutral-100">À retenir</p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            {currentStep.bullets.map((bullet, index) => (
                                <div key={bullet} className="flex gap-3 rounded-2xl border border-[#dfe6ee] bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fff1f1] text-xs font-black text-[#d71920] dark:bg-red-950/40 dark:text-red-200">{index + 1}</span>
                                    <p className="text-sm font-semibold leading-6 text-[#5f6b7a] dark:text-neutral-300">{bullet}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex gap-2">
                            {steps.map((step, index) => (
                                <button
                                    key={step.title}
                                    type="button"
                                    onClick={() => setCurrentIndex(index)}
                                    className={`h-2 flex-1 rounded-full transition-colors ${index <= currentIndex ? 'bg-[#ff2a2f]' : 'bg-[#dfe6ee] dark:bg-neutral-800'}`}
                                    aria-label={`Aller à l’étape ${index + 1}`}
                                />
                            ))}
                        </div>

                        <DialogFooter className="static mt-8 flex-col gap-3 bg-transparent sm:flex-col sm:space-x-0">
                            {!isLastStep && (
                                <Button type="button" onClick={handleNavigate} className="h-11 w-full rounded-xl bg-[#ff2a2f] font-black text-white hover:bg-[#d71920]">
                                    {currentStep.action}
                                </Button>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <Button type="button" variant="outline" disabled={isFirstStep} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} className="h-11 rounded-xl font-bold">
                                    <ArrowLeftIcon className="h-4 w-4" />
                                    Retour
                                </Button>
                                <Button type="button" variant="outline" onClick={() => isLastStep ? handleComplete() : setCurrentIndex((index) => Math.min(steps.length - 1, index + 1))} className="h-11 rounded-xl font-bold">
                                    {isLastStep ? 'Terminer' : 'Suivant'}
                                    {!isLastStep && <ArrowRightIcon className="h-4 w-4" />}
                                </Button>
                            </div>
                        </DialogFooter>
                    </aside>
                </div>
            </DialogContent>
        </Dialog>
    );
}
